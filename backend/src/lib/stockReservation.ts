import mongoose from "mongoose";
import { IOrderItem } from "../models/Order";
import { Product } from "../models/Product";

export async function reserveStockForItems(
  items: IOrderItem[],
  session: mongoose.ClientSession,
): Promise<void> {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);

    if (!product || product.stock < item.quantity) {
      const name = product?.name ?? "Product";
      throw new Error(`INSUFFICIENT_STOCK:${name}`);
    }

    product.stock -= item.quantity;
    await product.save({ session });
  }
}

export async function restoreStockForItems(
  items: IOrderItem[],
  session?: mongoose.ClientSession,
): Promise<void> {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session },
    );
  }
}

export async function finalizeSoldCounts(
  items: IOrderItem[],
  session: mongoose.ClientSession,
): Promise<void> {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { sold: item.quantity } },
      { session },
    );
  }
}
