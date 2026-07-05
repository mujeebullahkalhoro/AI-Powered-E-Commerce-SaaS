import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from "../controllers/authController";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import {
  registerSchema,
  loginSchema,
  validate,
} from "../lib/validations/auth";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", protect, logout);
router.post("/refresh-token", authLimiter, refreshToken);
router.get("/me", protect, getMe);

export default router;
