import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "../models/User";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}

export function generateAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
    throw new jwt.JsonWebTokenError("Invalid access token payload");
  }

  const { userId, role } = decoded as AccessTokenPayload;

  if (!userId || !role) {
    throw new jwt.JsonWebTokenError("Invalid access token payload");
  }

  return { userId, role };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

  if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
    throw new jwt.JsonWebTokenError("Invalid refresh token payload");
  }

  const { userId } = decoded as RefreshTokenPayload;

  if (!userId) {
    throw new jwt.JsonWebTokenError("Invalid refresh token payload");
  }

  return { userId };
}
