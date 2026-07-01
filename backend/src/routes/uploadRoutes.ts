import { Router } from "express";
import {
  uploadProductImages,
  deleteProductImage,
  handleMulterUpload,
} from "../controllers/uploadController";
import { protect, adminOnly } from "../middleware/auth";
import { uploadArray } from "../lib/upload";

const router = Router();

router.post(
  "/images",
  protect,
  adminOnly,
  handleMulterUpload(uploadArray),
  uploadProductImages,
);

router.delete("/image", protect, adminOnly, deleteProductImage);

export default router;
