import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category, ICategory } from "../models/Category";
import { Product } from "../models/Product";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  slugify,
} from "../lib/validations/category";

function formatCategory(category: ICategory) {
  const parent = category.parent as ICategory | null | undefined;

  return {
    id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    parent: parent
      ? {
          id: parent._id,
          name: parent.name,
        }
      : null,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function ensureUniqueNameAndSlug(
  name: string,
  slug: string,
  excludeId?: string,
): Promise<{ nameExists: boolean; slugExists: boolean }> {
  const nameFilter: Record<string, unknown> = {
    name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  };
  const slugFilter: Record<string, unknown> = { slug };

  if (excludeId) {
    nameFilter._id = { $ne: excludeId };
    slugFilter._id = { $ne: excludeId };
  }

  const [nameExists, slugExists] = await Promise.all([
    Category.exists(nameFilter),
    Category.exists(slugFilter),
  ]);

  return { nameExists: Boolean(nameExists), slugExists: Boolean(slugExists) };
}

async function validateParent(
  parentId: string | null | undefined,
  categoryId?: string,
): Promise<Types.ObjectId | null> {
  if (!parentId) {
    return null;
  }

  if (categoryId && parentId === categoryId) {
    throw Object.assign(new Error("Category cannot be its own parent"), {
      statusCode: 400,
    });
  }

  const parent = await Category.findOne({ _id: parentId, isActive: true });

  if (!parent) {
    throw Object.assign(new Error("Parent category not found or inactive"), {
      statusCode: 400,
    });
  }

  return new Types.ObjectId(parentId);
}

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .populate("parent", "name")
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories: categories.map(formatCategory),
  });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate("parent", "name");

  if (!category) {
    res.status(404).json({
      success: false,
      message: "Category not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    category: formatCategory(category),
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, image, parent, isActive } =
    req.body as CreateCategoryInput;

  const slug = req.body.slug ?? slugify(name);
  const { nameExists, slugExists } = await ensureUniqueNameAndSlug(name, slug);

  if (nameExists) {
    res.status(409).json({
      success: false,
      message: "Category name already exists",
    });
    return;
  }

  if (slugExists) {
    res.status(409).json({
      success: false,
      message: "Category slug already exists",
    });
    return;
  }

  try {
    const parentId = await validateParent(parent);

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parent: parentId,
      isActive: isActive ?? true,
    });

    await category.populate("parent", "name");

    res.status(201).json({
      success: true,
      category: formatCategory(category),
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };

    res.status(err.statusCode ?? 400).json({
      success: false,
      message: err.message,
    });
  }
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404).json({
      success: false,
      message: "Category not found",
    });
    return;
  }

  const updates = req.body as UpdateCategoryInput;
  const categoryId = category._id.toString();

  if (updates.name && updates.name !== category.name) {
    const newSlug = slugify(updates.name);
    const { nameExists, slugExists } = await ensureUniqueNameAndSlug(
      updates.name,
      newSlug,
      categoryId,
    );

    if (nameExists) {
      res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
      return;
    }

    if (slugExists) {
      res.status(409).json({
        success: false,
        message: "Category slug already exists",
      });
      return;
    }

    category.name = updates.name;
    category.slug = newSlug;
  }

  if (updates.description !== undefined) {
    category.description = updates.description;
  }

  if (updates.image !== undefined) {
    category.image = updates.image ?? undefined;
  }

  if (updates.isActive !== undefined) {
    category.isActive = updates.isActive;
  }

  if (updates.parent !== undefined) {
    try {
      category.parent = await validateParent(updates.parent, categoryId);
    } catch (error) {
      const err = error as Error & { statusCode?: number };

      res.status(err.statusCode ?? 400).json({
        success: false,
        message: err.message,
      });
      return;
    }
  }

  await category.save();
  await category.populate("parent", "name");

  res.status(200).json({
    success: true,
    category: formatCategory(category),
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404).json({
      success: false,
      message: "Category not found",
    });
    return;
  }

  const activeProductCount = await Product.countDocuments({
    category: category._id,
    isActive: true,
  });

  if (activeProductCount > 0) {
    res.status(409).json({
      success: false,
      message: "Cannot delete category with active products",
    });
    return;
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
