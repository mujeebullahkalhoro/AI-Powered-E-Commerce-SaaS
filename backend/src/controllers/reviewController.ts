import { Request, Response } from "express";
import { Types } from "mongoose";
import { Review, IReview } from "../models/Review";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  CreateReviewInput,
  UpdateReviewInput,
  getReviewsQuerySchema,
} from "../lib/validations/review";

function formatReview(review: IReview) {
  const user = review.user as unknown as { _id: Types.ObjectId; name: string };

  return {
    id: review._id,
    user: user
      ? {
          id: user._id,
          name: user.name,
        }
      : review.user,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function recalculateProductRating(productId: string): Promise<void> {
  const [stats] = await Review.aggregate<{
    averageRating: number;
    reviewCount: number;
  }>([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Number(stats.averageRating.toFixed(2)) : 0,
    reviewCount: stats?.reviewCount ?? 0,
  });
}

async function userHasDeliveredProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const order = await Order.exists({
    user: userId,
    orderStatus: "delivered",
    "items.product": productId,
  });

  return Boolean(order);
}

export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const parsed = getReviewsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      return;
    }

    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId }),
    ]);

    res.status(200).json({
      success: true,
      reviews: reviews.map(formatReview),
      total,
      page,
      pages: Math.ceil(total / limit) || 0,
    });
  },
);

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const { rating, comment } = req.body as CreateReviewInput;

  if (!Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  const isVerifiedBuyer = await userHasDeliveredProduct(req.user!.id, productId);

  if (!isVerifiedBuyer) {
    res.status(403).json({
      success: false,
      message: "Only verified buyers who received this product can leave a review",
    });
    return;
  }

  const existingReview = await Review.findOne({
    user: req.user!.id,
    product: productId,
  });

  if (existingReview) {
    res.status(409).json({
      success: false,
      message: "You have already reviewed this product",
    });
    return;
  }

  const review = await Review.create({
    user: req.user!.id,
    product: productId,
    rating,
    comment,
  });

  await recalculateProductRating(productId);
  await review.populate("user", "name");

  res.status(201).json({
    success: true,
    review: formatReview(review),
  });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const reviewId = String(req.params.reviewId);

  if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(reviewId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product or review ID",
    });
    return;
  }

  const review = await Review.findOne({ _id: reviewId, product: productId });

  if (!review) {
    res.status(404).json({
      success: false,
      message: "Review not found",
    });
    return;
  }

  if (review.user.toString() !== req.user!.id) {
    res.status(403).json({
      success: false,
      message: "Not authorized to update this review",
    });
    return;
  }

  const updates = req.body as UpdateReviewInput;

  if (updates.rating !== undefined) review.rating = updates.rating;
  if (updates.comment !== undefined) review.comment = updates.comment ?? undefined;

  await review.save();
  await recalculateProductRating(productId);
  await review.populate("user", "name");

  res.status(200).json({
    success: true,
    review: formatReview(review),
  });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const reviewId = String(req.params.reviewId);

  if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(reviewId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product or review ID",
    });
    return;
  }

  const review = await Review.findOne({ _id: reviewId, product: productId });

  if (!review) {
    res.status(404).json({
      success: false,
      message: "Review not found",
    });
    return;
  }

  const isOwner = review.user.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      success: false,
      message: "Not authorized to delete this review",
    });
    return;
  }

  await review.deleteOne();
  await recalculateProductRating(productId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});
