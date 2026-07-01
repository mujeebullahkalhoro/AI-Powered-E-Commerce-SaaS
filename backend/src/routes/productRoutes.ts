import { Router } from "express";
import {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../lib/validations/auth";
import {
  createProductSchema,
  updateProductSchema,
} from "../lib/validations/product";

const router = Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);
router.post("/", protect, adminOnly, validate(createProductSchema), createProduct);
router.put("/:id", protect, adminOnly, validate(updateProductSchema), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
