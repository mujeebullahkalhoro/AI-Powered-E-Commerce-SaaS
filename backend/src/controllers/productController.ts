import { Request, Response } from "express";
import { SortOrder } from "mongoose";
import { Product, IProduct } from "../models/Product";
import { Category, ICategory } from "../models/Category";
import { asyncHandler } from "../middleware/asyncHandler";
import { deleteImage } from "../lib/cloudinary";
import { generateProductEmbedding } from "../lib/ai/embeddings";
import {
  CreateProductInput,
  UpdateProductInput,
  GetProductsQuery,
  getProductsQuerySchema,
} from "../lib/validations/product";

function formatProduct(product: IProduct) {
  const category =
    product.populated("category") && typeof product.category === "object"
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
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function getSortOption(sort: GetProductsQuery["sort"]): Record<string, SortOrder> {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "rating":
      return { averageRating: -1, reviewCount: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

function getCategoryName(product: IProduct): string {
  if (
    product.populated("category") &&
    typeof product.category === "object" &&
    product.category !== null &&
    "name" in product.category
  ) {
    return (product.category as unknown as ICategory).name;
  }

  return "Unknown";
}

function scheduleProductEmbedding(product: IProduct): void {
  const productId = product._id.toString();

  generateProductEmbedding({
    name: product.name,
    description: product.description,
    tags: product.tags,
    category: getCategoryName(product),
  })
    .then((embedding) => Product.findByIdAndUpdate(productId, { embedding }))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to generate embedding for product ${productId}:`,
        message,
      );
    });
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getProductsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const { page, limit, category, minPrice, maxPrice, sort, search } = parsed.data;

  const filter: Record<string, unknown> = { isActive: true };

  if (category) {
    const categoryDoc = await Category.findOne({ slug: category, isActive: true });

    if (!categoryDoc) {
      res.status(200).json({
        success: true,
        products: [],
        total: 0,
        page,
        pages: 0,
      });
      return;
    }

    filter.category = categoryDoc._id;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};

    if (minPrice !== undefined) {
      priceFilter.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      priceFilter.$lte = maxPrice;
    }

    filter.price = priceFilter;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const total = await Product.countDocuments(filter);
  const pages = Math.ceil(total / limit) || 0;
  const skip = (page - 1) * limit;

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort(getSortOption(sort))
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    products: products.map(formatProduct),
    total,
    page,
    pages,
  });
});

export const getFeaturedProducts = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await Product.find({
      isActive: true,
      stock: { $gt: 0 },
    })
      .populate("category", "name slug")
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      products: products.map(formatProduct),
    });
  },
);

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate("category", "name slug");

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    product: formatProduct(product),
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateProductInput;

  const category = await Category.findOne({ _id: data.category, isActive: true });

  if (!category) {
    res.status(400).json({
      success: false,
      message: "Category not found or inactive",
    });
    return;
  }

  const product = await Product.create({
    ...data,
    images: data.images ?? [],
    tags: data.tags ?? [],
    isActive: data.isActive ?? true,
  });

  await product.populate("category", "name slug");

  scheduleProductEmbedding(product);

  res.status(201).json({
    success: true,
    product: formatProduct(product),
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  const updates = req.body as UpdateProductInput;

  if (updates.category) {
    const category = await Category.findOne({
      _id: updates.category,
      isActive: true,
    });

    if (!category) {
      res.status(400).json({
        success: false,
        message: "Category not found or inactive",
      });
      return;
    }

    product.category = category._id;
  }

  if (updates.name !== undefined) product.name = updates.name;
  if (updates.description !== undefined) product.description = updates.description;
  if (updates.price !== undefined) product.price = updates.price;
  if (updates.comparePrice !== undefined) {
    product.comparePrice = updates.comparePrice ?? undefined;
  }
  if (updates.images !== undefined) product.images = updates.images;
  if (updates.stock !== undefined) product.stock = updates.stock;
  if (updates.tags !== undefined) product.tags = updates.tags;
  if (updates.seoTitle !== undefined) product.seoTitle = updates.seoTitle ?? undefined;
  if (updates.metaDescription !== undefined) {
    product.metaDescription = updates.metaDescription ?? undefined;
  }
  if (updates.isActive !== undefined) product.isActive = updates.isActive;

  await product.save();
  await product.populate("category", "name slug");

  const embeddingFieldsChanged =
    updates.name !== undefined ||
    updates.description !== undefined ||
    updates.tags !== undefined ||
    updates.category !== undefined;

  if (embeddingFieldsChanged) {
    scheduleProductEmbedding(product);
  }

  res.status(200).json({
    success: true,
    product: formatProduct(product),
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  if (product.images.length > 0) {
    await Promise.allSettled(
      product.images.map((image) => deleteImage(image.publicId)),
    );
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
