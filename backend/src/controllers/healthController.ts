import { Request, Response } from "express";
import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join } from "path";
import { env } from "../config/env";
import { asyncHandler } from "../middleware/asyncHandler";

const startTime = Date.now();

function getPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8"),
    ) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getDatabaseStatus(): string {
  const state = mongoose.connection.readyState;

  if (state === 1) return "connected";
  if (state === 2) return "connecting";
  if (state === 3) return "disconnecting";
  return "disconnected";
}

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const database = getDatabaseStatus();
  const healthy = database === "connected";

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "ok" : "degraded",
    database,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: getPackageVersion(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});
