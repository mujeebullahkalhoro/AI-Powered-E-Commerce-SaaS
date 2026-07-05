import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth";
import { aiLimiter, reviewSummaryLimiter } from "../middleware/rateLimit";
import { validate } from "../lib/validations/auth";
import {
  generateDescriptionSchema,
  generateSEOSchema,
  generateTagsSchema,
} from "../lib/validations/ai";
import {
  generateDescription,
  generateSEO,
  generateTags,
  generateReviewSummary,
} from "../controllers/aiController";

const router = Router();

router.post(
  "/description",
  aiLimiter,
  protect,
  adminOnly,
  validate(generateDescriptionSchema),
  generateDescription,
);
router.post(
  "/seo",
  aiLimiter,
  protect,
  adminOnly,
  validate(generateSEOSchema),
  generateSEO,
);
router.post(
  "/tags",
  aiLimiter,
  protect,
  adminOnly,
  validate(generateTagsSchema),
  generateTags,
);
router.get(
  "/review-summary/:productId",
  reviewSummaryLimiter,
  generateReviewSummary,
);

export default router;
