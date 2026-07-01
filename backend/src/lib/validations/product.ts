import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid category ID");

export const productImageSchema = z.object({
  url: z.string().trim().url("Image URL must be valid"),
  publicId: z.string().trim().min(1, "Image public ID is required"),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  price: z.number().min(0, "Price must be zero or greater"),
  comparePrice: z.number().min(0, "Compare price must be zero or greater").optional(),
  images: z.array(productImageSchema).max(8, "Maximum 8 images allowed").optional(),
  category: objectIdSchema,
  stock: z.number().int().min(0, "Stock must be zero or greater"),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  seoTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(200, "Name must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description must be at most 5000 characters")
      .optional(),
    price: z.number().min(0, "Price must be zero or greater").optional(),
    comparePrice: z
      .number()
      .min(0, "Compare price must be zero or greater")
      .nullable()
      .optional(),
    images: z.array(productImageSchema).max(8, "Maximum 8 images allowed").optional(),
    category: objectIdSchema.optional(),
    stock: z.number().int().min(0, "Stock must be zero or greater").optional(),
    tags: z.array(z.string().trim().min(1)).max(20).optional(),
    seoTitle: z.string().trim().max(200).nullable().optional(),
    metaDescription: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "rating"])
    .default("newest"),
  search: z.string().trim().min(1).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
