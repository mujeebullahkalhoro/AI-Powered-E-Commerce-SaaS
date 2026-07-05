import { Request, Response } from "express";
import { IProduct } from "../models/Product";
import { ICategory } from "../models/Category";
import { asyncHandler } from "../middleware/asyncHandler";
import { hybridSearch } from "../lib/ai/vectorSearch";
import { searchQuerySchema } from "../lib/validations/search";

function formatSearchProduct(product: IProduct, score: number) {
  const category =
    product.category &&
    typeof product.category === "object" &&
    "name" in product.category &&
    "slug" in product.category
      ? (product.category as unknown as ICategory)
      : undefined;

  return {
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images,
    category: category
      ? {
          id: category._id,
          name: category.name,
          slug: category.slug,
        }
      : product.category,
    stock: product.stock,
    sold: product.sold,
    tags: product.tags,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    isActive: product.isActive,
    score,
  };
}

export const search = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const { q, category, minPrice, maxPrice, limit } = parsed.data;

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    res.status(400).json({
      success: false,
      message: "minPrice cannot be greater than maxPrice",
    });
    return;
  }

  const results = await hybridSearch(q, limit, {
    category,
    minPrice,
    maxPrice,
  });

  res.status(200).json({
    success: true,
    query: q,
    count: results.length,
    products: results.map(({ product, score }) =>
      formatSearchProduct(product, score),
    ),
  });
});
