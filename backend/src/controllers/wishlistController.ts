import { Request, Response } from "express";
import { Types } from "mongoose";
import { Wishlist } from "../models/Wishlist";
import { Product, IProduct } from "../models/Product";
import { asyncHandler } from "../middleware/asyncHandler";

const PRODUCT_SELECT = "name price images isActive";

function formatWishlistProduct(product: IProduct) {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    images: product.images,
    isActive: product.isActive,
  };
}

async function findOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  return wishlist;
}

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  let wishlist = await Wishlist.findOne({ user: req.user!.id }).populate({
    path: "products",
    select: PRODUCT_SELECT,
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user!.id, products: [] });
    await wishlist.populate({
      path: "products",
      select: PRODUCT_SELECT,
    });
  }

  const products = (wishlist.products as unknown as IProduct[]).map(
    formatWishlistProduct,
  );

  res.status(200).json({
    success: true,
    wishlist: {
      id: wishlist._id,
      products,
      count: products.length,
    },
  });
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);

  if (!Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found or inactive",
    });
    return;
  }

  const wishlist = await findOrCreateWishlist(req.user!.id);

  await Wishlist.updateOne(
    { _id: wishlist._id },
    { $addToSet: { products: productId } },
  );

  const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
    path: "products",
    select: PRODUCT_SELECT,
  });

  const products = (updatedWishlist!.products as unknown as IProduct[]).map(
    formatWishlistProduct,
  );

  res.status(200).json({
    success: true,
    wishlist: {
      id: updatedWishlist!._id,
      products,
      count: products.length,
    },
  });
});

export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const wishlist = await findOrCreateWishlist(req.user!.id);

    await Wishlist.updateOne(
      { _id: wishlist._id },
      { $pull: { products: productId } },
    );

    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "products",
      select: PRODUCT_SELECT,
    });

    const products = (updatedWishlist!.products as unknown as IProduct[]).map(
      formatWishlistProduct,
    );

    res.status(200).json({
      success: true,
      wishlist: {
        id: updatedWishlist!._id,
        products,
        count: products.length,
      },
    });
  },
);
