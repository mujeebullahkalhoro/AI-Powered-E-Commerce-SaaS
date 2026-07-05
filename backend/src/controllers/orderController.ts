import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { Order, IOrder, IOrderItem } from "../models/Order";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import { asyncHandler } from "../middleware/asyncHandler";
import { env } from "../config/env";
import { stripe } from "../lib/stripe";
import {
  reserveStockForItems,
  restoreStockForItems,
  finalizeSoldCounts,
} from "../lib/stockReservation";
import {
  CreatePaymentIntentInput,
  getAllOrdersQuerySchema,
  getMyOrdersQuerySchema,
} from "../lib/validations/order";

const SHIPPING_FLAT_RATE = 5;
const FREE_SHIPPING_THRESHOLD = 50;

interface CartSnapshot {
  items: IOrderItem[];
  shippingAddress: CreatePaymentIntentInput["shippingAddress"];
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
}

function calculateShippingCost(subtotal: number): number {
  return subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FLAT_RATE : 0;
}

function formatOrderItem(
  item: IOrderItem,
  populated = false,
): Record<string, unknown> {
  const product = item.product as unknown as {
    _id: Types.ObjectId;
    name: string;
    images: { url: string }[];
  };

  if (populated && product?.name) {
    return {
      product: {
        id: product._id,
        name: product.name,
        images: product.images,
      },
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      lineTotal: item.price * item.quantity,
    };
  }

  return {
    product: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    lineTotal: item.price * item.quantity,
  };
}

function formatOrder(order: IOrder, populatedItems = false) {
  const user = order.user as unknown as {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };

  return {
    id: order._id,
    user: user?.name
      ? { id: user._id, name: user.name, email: user.email }
      : order.user,
    items: order.items.map((item) => formatOrderItem(item, populatedItems)),
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    stripePaymentIntentId: order.stripePaymentIntentId,
    orderStatus: order.orderStatus,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discount: order.discount,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function validateCartAndBuildSnapshot(
  userId: string,
  shippingAddress: CreatePaymentIntentInput["shippingAddress"],
  paymentMethod: string,
  session: mongoose.ClientSession,
): Promise<CartSnapshot> {
  const cart = await Cart.findOne({ user: userId }).session(session);

  if (!cart || cart.items.length === 0) {
    throw new Error("CART_EMPTY");
  }

  const orderItems: IOrderItem[] = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product).session(session);

    if (!product || !product.isActive) {
      throw new Error(`PRODUCT_UNAVAILABLE:${item.product.toString()}`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      price: item.price,
      quantity: item.quantity,
      image: product.images[0]?.url ?? "",
    });
  }

  const subtotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = calculateShippingCost(subtotal);
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  return {
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCost,
    discount,
    total,
  };
}

function parseCartSnapshot(raw: string): CartSnapshot | null {
  try {
    return JSON.parse(raw) as CartSnapshot;
  } catch {
    return null;
  }
}

async function fulfillPaidOrder(
  paymentIntent: Stripe.PaymentIntent,
  snapshot: CartSnapshot,
  userId: string,
  stockReserved: boolean,
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!stockReserved) {
      for (const item of snapshot.items) {
        const product = await Product.findById(item.product).session(session);

        if (!product || product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        product.stock -= item.quantity;
        product.sold += item.quantity;
        await product.save({ session });
      }
    } else {
      await finalizeSoldCounts(snapshot.items, session);
    }

    await Order.create(
      [
        {
          user: userId,
          items: snapshot.items,
          shippingAddress: snapshot.shippingAddress,
          paymentMethod: snapshot.paymentMethod,
          paymentStatus: "paid",
          stripePaymentIntentId: paymentIntent.id,
          orderStatus: "processing",
          subtotal: snapshot.subtotal,
          shippingCost: snapshot.shippingCost,
          discount: snapshot.discount,
          total: snapshot.total,
        },
      ],
      { session },
    );

    const cart = await Cart.findOne({ user: userId }).session(session);

    if (cart) {
      cart.items = [];
      await cart.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (
      stockReserved &&
      error instanceof Error &&
      error.message === "INSUFFICIENT_STOCK"
    ) {
      await restoreStockForItems(snapshot.items);
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      await stripe.refunds.create({ payment_intent: paymentIntent.id });
    }

    throw error;
  } finally {
    session.endSession();
  }
}

export const createPaymentIntent = asyncHandler(
  async (req: Request, res: Response) => {
    const { shippingAddress, paymentMethod } =
      req.body as CreatePaymentIntentInput;

    const session = await mongoose.startSession();
    let snapshot: CartSnapshot | null = null;

    try {
      session.startTransaction();

      snapshot = await validateCartAndBuildSnapshot(
        req.user!.id,
        shippingAddress,
        paymentMethod,
        session,
      );

      await reserveStockForItems(snapshot.items, session);
      await session.commitTransaction();
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      if (error instanceof Error) {
        if (error.message === "CART_EMPTY") {
          res.status(400).json({
            success: false,
            message: "Cart is empty",
          });
          return;
        }

        if (error.message.startsWith("PRODUCT_UNAVAILABLE:")) {
          res.status(400).json({
            success: false,
            message: "One or more products in your cart are no longer available",
          });
          return;
        }

        if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
          const productName = error.message.split(":")[1];
          res.status(400).json({
            success: false,
            message: `Insufficient stock for ${productName}`,
          });
          return;
        }
      }

      throw error;
    } finally {
      session.endSession();
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(snapshot!.total * 100),
        currency: "usd",
        metadata: {
          userId: req.user!.id,
          cartSnapshot: JSON.stringify(snapshot),
          stockReserved: "true",
        },
        automatic_payment_methods: { enabled: true },
      });

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        subtotal: snapshot!.subtotal,
        shippingCost: snapshot!.shippingCost,
        total: snapshot!.total,
      });
    } catch (error) {
      await restoreStockForItems(snapshot!.items);
      throw error;
    }
  },
);

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    res.status(400).json({
      success: false,
      message: "Missing Stripe signature",
    });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    res.status(400).json({
      success: false,
      message: "Invalid webhook signature",
    });
    return;
  }

  if (
    event.type !== "payment_intent.succeeded" &&
    event.type !== "payment_intent.canceled" &&
    event.type !== "payment_intent.payment_failed"
  ) {
    res.status(200).json({ received: true });
    return;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = paymentIntent.metadata.userId;
  const cartSnapshotRaw = paymentIntent.metadata.cartSnapshot;
  const stockReserved = paymentIntent.metadata.stockReserved === "true";

  if (!userId || !cartSnapshotRaw) {
    res.status(400).json({
      success: false,
      message: "Missing payment metadata",
    });
    return;
  }

  const snapshot = parseCartSnapshot(cartSnapshotRaw);

  if (!snapshot) {
    res.status(400).json({
      success: false,
      message: "Invalid cart snapshot in metadata",
    });
    return;
  }

  const existingOrder = await Order.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (
    event.type === "payment_intent.canceled" ||
    event.type === "payment_intent.payment_failed"
  ) {
    if (!existingOrder && stockReserved) {
      await restoreStockForItems(snapshot.items);
    }

    res.status(200).json({ received: true });
    return;
  }

  if (existingOrder) {
    res.status(200).json({ received: true });
    return;
  }

  try {
    await fulfillPaidOrder(paymentIntent, snapshot, userId, stockReserved);

    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      res.status(200).json({
        received: true,
        refunded: true,
        message: "Payment refunded due to insufficient stock",
      });
      return;
    }

    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getMyOrdersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user!.id })
      .populate({ path: "items.product", select: "name images" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user!.id }),
  ]);

  res.status(200).json({
    success: true,
    orders: orders.map((order) => formatOrder(order, true)),
    total,
    page,
    pages: Math.ceil(total / limit) || 0,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);

  if (!Types.ObjectId.isValid(orderId)) {
    res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
    return;
  }

  const order = await Order.findById(orderId).populate({
    path: "items.product",
    select: "name images",
  });

  if (!order) {
    res.status(404).json({
      success: false,
      message: "Order not found",
    });
    return;
  }

  const isOwner = order.user.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(404).json({
      success: false,
      message: "Order not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    order: formatOrder(order, true),
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getAllOrdersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const { page, limit, status } = parsed.data;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (status) {
    filter.orderStatus = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .populate({ path: "items.product", select: "name images" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    orders: orders.map((order) => formatOrder(order, true)),
    total,
    page,
    pages: Math.ceil(total / limit) || 0,
  });
});
