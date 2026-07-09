import { Request, Response } from "express";
import { Types } from "mongoose";
import { Order, OrderStatus } from "../models/Order";
import { User, IUser } from "../models/User";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getAllUsersQuerySchema,
  getAdminProductsQuerySchema,
  UpdateUserStatusInput,
  UpdateOrderStatusInput,
} from "../lib/validations/admin";
import { ICategory } from "../models/Category";
import { getAllOrders as getAllOrdersFromOrderController } from "./orderController";

const LOW_STOCK_THRESHOLD = 10;

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function formatUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isValidStatusTransition(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === next) {
    return true;
  }

  return ALLOWED_STATUS_TRANSITIONS[current].includes(next);
}

export const getDashboardStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      revenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      ordersByStatus,
      revenueByDay,
      topProducts,
    ] = await Promise.all([
      Order.aggregate<{ totalRevenue: number }>([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.aggregate<{ _id: OrderStatus; count: number }>([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ date: string; revenue: number }>([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: { $round: ["$revenue", 2] },
          },
        },
      ]),
      Order.aggregate<{
        productId: Types.ObjectId;
        name: string;
        revenue: number;
        unitsSold: number;
      }>([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            unitsSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: 1,
            revenue: { $round: ["$revenue", 2] },
            unitsSold: 1,
          },
        },
      ]),
    ]);

    const statusCounts = Object.fromEntries(
      ordersByStatus.map((entry) => [entry._id, entry.count]),
    ) as Record<OrderStatus, number>;

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: Number((revenueResult[0]?.totalRevenue ?? 0).toFixed(2)),
        totalOrders,
        totalProducts,
        totalUsers,
        ordersByStatus: {
          pending: statusCounts.pending ?? 0,
          processing: statusCounts.processing ?? 0,
          shipped: statusCounts.shipped ?? 0,
          delivered: statusCounts.delivered ?? 0,
          cancelled: statusCounts.cancelled ?? 0,
        },
        revenueLast30Days: revenueByDay,
        topProductsByRevenue: topProducts,
      },
    });
  },
);

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getAllUsersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const { page, limit, role, search } = parsed.data;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users: users.map(formatUser),
    total,
    page,
    pages: Math.ceil(total / limit) || 0,
  });
});

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);
    const { isActive } = req.body as UpdateUserStatusInput;

    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    if (!isActive && userId === req.user!.id) {
      res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true },
    ).select("name email role isActive createdAt updatedAt");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  },
);

export const getAllOrders = getAllOrdersFromOrderController;

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = String(req.params.id);
    const { orderStatus } = req.body as UpdateOrderStatusInput;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (!isValidStatusTransition(order.orderStatus, orderStatus)) {
      res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.orderStatus} to ${orderStatus}`,
      });
      return;
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt,
      },
    });
  },
);

function formatAdminProduct(product: {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: { url: string; publicId: string }[];
  category: unknown;
  stock: number;
  sold: number;
  tags: string[];
  seoTitle?: string;
  metaDescription?: string;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const category =
    typeof product.category === "object" &&
    product.category !== null &&
    "name" in product.category
      ? (product.category as ICategory)
      : undefined;

  return {
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images,
    category: category
      ? { id: category._id, name: category.name, slug: category.slug }
      : product.category,
    stock: product.stock,
    sold: product.sold,
    tags: product.tags,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export const getAdminProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = getAdminProductsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      return;
    }

    const { page, limit, search, includeInactive } = parsed.data;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (!includeInactive) {
      filter.isActive = true;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      products: products.map(formatAdminProduct),
      total,
      page,
      pages: Math.ceil(total / limit) || 0,
    });
  },
);

export const getAdminCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find()
      .populate("parent", "name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.map((category) => {
        const parent = category.parent as ICategory | null | undefined;

        return {
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          parent: parent
            ? { id: parent._id, name: parent.name }
            : null,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        };
      }),
    });
  },
);

export const getInventoryReport = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await Product.find({
      isActive: true,
      stock: { $lt: LOW_STOCK_THRESHOLD },
    })
      .select("name stock sold price isActive images")
      .populate("category", "name slug")
      .sort({ stock: 1 });

    res.status(200).json({
      success: true,
      threshold: LOW_STOCK_THRESHOLD,
      count: products.length,
      products: products.map((product) => ({
        id: product._id,
        name: product.name,
        stock: product.stock,
        sold: product.sold,
        price: product.price,
        isActive: product.isActive,
        image: product.images[0]?.url ?? null,
        category: product.category,
      })),
    });
  },
);
