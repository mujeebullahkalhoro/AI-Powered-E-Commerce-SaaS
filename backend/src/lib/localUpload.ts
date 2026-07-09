import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import type { CloudinaryImageResult } from "./cloudinary";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const PRODUCT_UPLOAD_DIR = path.join(UPLOAD_ROOT, "products");
const LOCAL_PUBLIC_ID_PREFIX = "local/products/";

function extensionFromName(filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }

  return ".jpg";
}

export function isLocalPublicId(publicId: string): boolean {
  return publicId.startsWith(LOCAL_PUBLIC_ID_PREFIX);
}

export async function uploadImageLocal(
  fileBuffer: Buffer,
  originalName = "image.jpg",
): Promise<CloudinaryImageResult> {
  await fs.mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });

  const filename = `${crypto.randomUUID()}${extensionFromName(originalName)}`;
  const filepath = path.join(PRODUCT_UPLOAD_DIR, filename);

  await fs.writeFile(filepath, fileBuffer);

  return {
    url: `${env.API_PUBLIC_URL}/uploads/products/${filename}`,
    publicId: `${LOCAL_PUBLIC_ID_PREFIX}${filename}`,
  };
}

export async function deleteImageLocal(publicId: string): Promise<void> {
  if (!isLocalPublicId(publicId)) {
    return;
  }

  const filename = publicId.slice(LOCAL_PUBLIC_ID_PREFIX.length);
  const filepath = path.join(PRODUCT_UPLOAD_DIR, filename);

  await fs.unlink(filepath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}
