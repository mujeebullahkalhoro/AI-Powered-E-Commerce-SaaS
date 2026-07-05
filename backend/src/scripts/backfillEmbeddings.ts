import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { Product } from "../models/Product";
import { ICategory } from "../models/Category";
import { generateProductEmbedding } from "../lib/ai/embeddings";

function getCategoryName(
  category: mongoose.Types.ObjectId | ICategory,
): string {
  if (typeof category === "object" && category !== null && "name" in category) {
    return category.name;
  }

  return "Unknown";
}

async function backfillEmbeddings(): Promise<void> {
  await connectDB();

  const products = await Product.find({
    isActive: true,
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $size: 0 } },
    ],
  })
    .select("+embedding")
    .populate("category", "name");

  const total = products.length;
  console.log(`Found ${total} active products missing embeddings.`);

  let processed = 0;
  let failed = 0;

  for (const product of products) {
    const productId = product._id.toString();

    try {
      const embedding = await generateProductEmbedding({
        name: product.name,
        description: product.description,
        tags: product.tags,
        category: getCategoryName(product.category),
      });

      await Product.findByIdAndUpdate(productId, { embedding });
      processed += 1;

      if (processed % 10 === 0 || processed === total) {
        console.log(`Progress: ${processed}/${total} embeddings saved`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to generate embedding for product ${productId}:`,
        message,
      );
    }
  }

  console.log(
    `Backfill complete. Saved: ${processed}, Failed: ${failed}, Total: ${total}`,
  );

  await mongoose.disconnect();
}

backfillEmbeddings().catch((error) => {
  console.error("Backfill embeddings script failed:", error);
  process.exit(1);
});
