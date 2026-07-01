import { Router } from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../lib/validations/auth";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../lib/validations/category";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);
router.post("/", protect, adminOnly, validate(createCategorySchema), createCategory);
router.put("/:id", protect, adminOnly, validate(updateCategorySchema), updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
