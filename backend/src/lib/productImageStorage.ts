import { uploadImage, deleteImage, type CloudinaryImageResult } from "./cloudinary";
import { deleteImageLocal, uploadImageLocal } from "./localUpload";
import { env } from "../config/env";

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 45_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
): Promise<CloudinaryImageResult> {
  return withTimeout(
    uploadImage(fileBuffer, folder),
    CLOUDINARY_UPLOAD_TIMEOUT_MS,
    "Image upload timed out. Try a smaller image or use local uploads in development.",
  );
}

export async function storeProductImage(
  fileBuffer: Buffer,
  originalName: string,
): Promise<CloudinaryImageResult> {
  if (env.USE_LOCAL_UPLOAD) {
    return uploadImageLocal(fileBuffer, originalName);
  }

  try {
    return await uploadToCloudinary(fileBuffer, "products");
  } catch (error) {
    if (env.NODE_ENV === "development") {
      console.warn("Cloudinary upload failed, saving locally instead:", error);
      return uploadImageLocal(fileBuffer, originalName);
    }

    throw error;
  }
}

export async function removeProductImage(publicId: string): Promise<void> {
  if (publicId.startsWith("local/")) {
    await deleteImageLocal(publicId);
    return;
  }

  await deleteImage(publicId);
}
