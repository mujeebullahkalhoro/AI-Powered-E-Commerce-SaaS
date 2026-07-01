import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { uploadImage, deleteImage } from "../lib/cloudinary";

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
      files.map((file) => uploadImage(file.buffer, "products")),
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

    await deleteImage(publicId.trim());

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
        res.status(400).json({
          success: false,
          message: error.message || "File upload failed",
        });
        return;
      }

      next();
    });
  };
}
