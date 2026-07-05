import { Product } from "../models/Product";

export async function invalidateProductReviewSummary(
  productId: string,
): Promise<void> {
  await Product.findByIdAndUpdate(productId, {
    $unset: { reviewSummary: 1, reviewSummaryUpdatedAt: 1 },
  });
}
