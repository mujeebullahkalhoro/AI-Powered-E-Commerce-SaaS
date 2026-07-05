import { Request, Response } from "express";
import { Types } from "mongoose";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  generateProductDescription,
  generateSEO as generateProductSEO,
  generateTags as generateProductTags,
  summarizeReviews,
} from "../lib/ai/groq";
import {
  GenerateDescriptionInput,
  GenerateSEOInput,
  GenerateTagsInput,
} from "../lib/validations/ai";

export const generateDescription = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, category, attributes } = req.body as GenerateDescriptionInput;

    const description = await generateProductDescription(
      name,
      category,
      attributes,
    );

    res.status(200).json({
      success: true,
      description,
    });
  },
);

export const generateSEO = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, category } = req.body as GenerateSEOInput;

  const seo = await generateProductSEO(name, description, category);

  res.status(200).json({
    success: true,
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    keywords: seo.keywords,
  });
});

export const generateTags = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, category } = req.body as GenerateTagsInput;

  const tags = await generateProductTags(name, description, category);

  res.status(200).json({
    success: true,
    tags,
  });
});

export const generateReviewSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);

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

    const latestReview = await Review.findOne({ product: productId })
      .sort({ createdAt: -1 })
      .select("createdAt");

    const cacheIsFresh =
      product.reviewSummary &&
      product.reviewSummaryUpdatedAt &&
      (!latestReview ||
        latestReview.createdAt <= product.reviewSummaryUpdatedAt);

    if (cacheIsFresh) {
      res.status(200).json({
        success: true,
        summary: product.reviewSummary,
        cached: true,
      });
      return;
    }

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("rating comment");

    const summary = await summarizeReviews(
      reviews.map((review) => ({
        rating: review.rating,
        comment: review.comment ?? "",
      })),
    );

    product.reviewSummary = summary;
    product.reviewSummaryUpdatedAt = new Date();
    await product.save();

    res.status(200).json({
      success: true,
      summary,
      cached: false,
    });
  },
);
