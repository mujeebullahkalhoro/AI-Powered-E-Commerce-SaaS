import { Request, Response } from "express";
import { Types } from "mongoose";
import { Cart, ICart, ICartItem } from "../models/Cart";
import { Product, IProduct } from "../models/Product";
import { asyncHandler } from "../middleware/asyncHandler";

const PRODUCT_SELECT = "name price images stock isActive";

function formatPopulatedProduct(product: IProduct) {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    images: product.images,
    stock: product.stock,
    isActive: product.isActive,
  };
}

function formatCartItem(item: ICartItem) {
  const product = item.product as unknown as IProduct;

  return {
    product: formatPopulatedProduct(product),
    quantity: item.quantity,
    price: item.price,
    lineTotal: item.price * item.quantity,
  };
}

function calculateTotals(items: ICartItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return { subtotal, itemCount };
}

async function findOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
}

async function getPopulatedCart(userId: string) {
  return Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });
}

function isActivePopulatedProduct(product: unknown): product is IProduct {
  return (
    typeof product === "object" &&
    product !== null &&
    "isActive" in product &&
    (product as IProduct).isActive === true
  );
}

async function syncInactiveCartItems(
  cart: NonNullable<Awaited<ReturnType<typeof getPopulatedCart>>>,
) {
  const activeItems = cart.items.filter((item) =>
    isActivePopulatedProduct(item.product),
  );

  if (activeItems.length !== cart.items.length) {
    cart.items = activeItems;
    await cart.save();
  }

  return cart;
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  let cart =
    (await getPopulatedCart(req.user!.id)) ??
    (await Cart.create({ user: req.user!.id, items: [] }));

  await cart.populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });

  cart = await syncInactiveCartItems(cart);

  const totals = calculateTotals(cart.items);

  res.status(200).json({
    success: true,
    cart: {
      id: cart._id,
      items: cart.items.map(formatCartItem),
      totals,
    },
  });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body as {
    productId?: string;
    quantity?: number;
  };

  if (!productId || !Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Valid productId is required",
    });
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({
      success: false,
      message: "Quantity must be a positive integer",
    });
    return;
  }

  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found or inactive",
    });
    return;
  }

  if (product.stock < 1) {
    res.status(400).json({
      success: false,
      message: "Product is out of stock",
    });
    return;
  }

  const cart = await findOrCreateCart(req.user!.id);
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity = Math.min(
      existingItem.quantity + quantity,
      product.stock,
    );
  } else {
    cart.items.push({
      product: product._id,
      quantity: Math.min(quantity, product.stock),
      price: product.price,
    });
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });

  const totals = calculateTotals(cart.items);

  res.status(200).json({
    success: true,
    cart: {
      id: cart._id,
      items: cart.items.map(formatCartItem),
      totals,
    },
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const { quantity } = req.body as { quantity?: number };

  if (!Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  if (quantity === undefined || !Number.isInteger(quantity) || quantity < 0) {
    res.status(400).json({
      success: false,
      message: "Quantity must be a non-negative integer",
    });
    return;
  }

  const cart = await findOrCreateCart(req.user!.id);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (itemIndex === -1) {
    res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
    return;
  }

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
      return;
    }

    cart.items[itemIndex].quantity = Math.min(quantity, product.stock);
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });

  const totals = calculateTotals(cart.items);

  res.status(200).json({
    success: true,
    cart: {
      id: cart._id,
      items: cart.items.map(formatCartItem),
      totals,
    },
  });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);

  if (!Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  const cart = await findOrCreateCart(req.user!.id);
  const initialLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  if (cart.items.length === initialLength) {
    res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
    return;
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });

  const totals = calculateTotals(cart.items);

  res.status(200).json({
    success: true,
    cart: {
      id: cart._id,
      items: cart.items.map(formatCartItem),
      totals,
    },
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await findOrCreateCart(req.user!.id);

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    cart: {
      id: cart._id,
      items: [],
      totals: {
        subtotal: 0,
        itemCount: 0,
      },
    },
  });
});
