import { Router } from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/auth";
import { validate } from "../lib/validations/auth";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../lib/validations/review";

const router = Router({ mergeParams: true });

router.get("/", getProductReviews);
router.post("/", protect, validate(createReviewSchema), createReview);
router.put("/:reviewId", protect, validate(updateReviewSchema), updateReview);
router.delete("/:reviewId", protect, deleteReview);

export default router;
