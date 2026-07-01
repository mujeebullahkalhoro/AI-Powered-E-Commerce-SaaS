import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from "../controllers/authController";
import { protect } from "../middleware/auth";
import {
  registerSchema,
  loginSchema,
  validate,
} from "../lib/validations/auth";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);

export default router;
