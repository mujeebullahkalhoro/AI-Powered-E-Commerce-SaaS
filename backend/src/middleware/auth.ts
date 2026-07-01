import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { verifyAccessToken } from "../lib/jwt";

export async function protect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
      return;
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("role isActive");

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Not authorized, user not found or inactive",
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
}

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Not authorized",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Forbidden, admin access required",
    });
    return;
  }

  next();
}
