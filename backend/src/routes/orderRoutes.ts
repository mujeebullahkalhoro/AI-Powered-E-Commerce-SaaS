import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../lib/validations/auth";
import { createPaymentIntentSchema } from "../lib/validations/order";
import {
  createPaymentIntent,
  getMyOrders,
  getOrderById,
  getAllOrders,
} from "../controllers/orderController";

const router = Router();

router.post(
  "/create-payment-intent",
  protect,
  validate(createPaymentIntentSchema),
  createPaymentIntent,
);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.get("/", protect, adminOnly, getAllOrders);

export default router;
