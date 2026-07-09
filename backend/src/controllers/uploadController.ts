import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler";
import { storeProductImage, removeProductImage } from "../lib/productImageStorage";
import { MAX_FILE_SIZE } from "../lib/upload";

export const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No images provided",
      });
      return;
    }

    const images = await Promise.all(
      files.map((file) => storeProductImage(file.buffer, file.originalname)),
    );

    res.status(201).json({
      success: true,
      count: images.length,
      images,
    });
  },
);

export const deleteProductImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { publicId } = req.body as { publicId?: string };

    if (!publicId?.trim()) {
      res.status(400).json({
        success: false,
        message: "publicId is required",
      });
      return;
    }

    await removeProductImage(publicId.trim());

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  },
);

export function handleMulterUpload(
  middleware: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error) => {
      if (error) {
        let message = error.message || "File upload failed";

        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
          message = `Each image must be ${MAX_FILE_SIZE / (1024 * 1024)} MB or smaller`;
        }

        res.status(400).json({
          success: false,
          message,
        });
        return;
      }

      next();
    });
  };
}
