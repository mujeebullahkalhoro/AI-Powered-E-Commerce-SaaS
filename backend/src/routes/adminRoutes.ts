import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../lib/validations/auth";
import {
  updateUserStatusSchema,
  updateOrderStatusSchema,
} from "../lib/validations/admin";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  updateOrderStatus,
  getInventoryReport,
} from "../controllers/adminController";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/status", validate(updateUserStatusSchema), updateUserStatus);
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", validate(updateOrderStatusSchema), updateOrderStatus);
router.get("/inventory", getInventoryReport);

export default router;
