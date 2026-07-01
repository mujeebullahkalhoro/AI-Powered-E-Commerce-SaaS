import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
    return;
  }

  const duplicateKeyError = err as MongoDuplicateKeyError;

  if (duplicateKeyError.code === 11000) {
    res.status(409).json({
      success: false,
      message: "Duplicate field value entered",
      errors: duplicateKeyError.keyValue
        ? [JSON.stringify(duplicateKeyError.keyValue)]
        : undefined,
    });
    return;
  }

  if (
    err instanceof jwt.JsonWebTokenError ||
    err instanceof jwt.TokenExpiredError ||
    err instanceof jwt.NotBeforeError
  ) {
    res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
