import { Types } from "mongoose";
import { Product, IProduct } from "../../models/Product";
import { Category } from "../../models/Category";
import { generateEmbedding } from "./embeddings";

export const VECTOR_INDEX_NAME = "product_vector_index";
const SEMANTIC_FALLBACK_THRESHOLD = 3;
const DEFAULT_LIMIT = 20;

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductSearchResult {
  product: IProduct;
  score: number;
}

async function resolveCategoryFilter(
  categorySlug?: string,
): Promise<Types.ObjectId | "not_found" | undefined> {
  if (!categorySlug) {
    return undefined;
  }

  const category = await Category.findOne({
    slug: categorySlug,
    isActive: true,
  }).select("_id");

  if (!category) {
    return "not_found";
  }

  return category._id;
}

async function buildMatchFilter(
  filters?: SearchFilters,
): Promise<Record<string, unknown> | null> {
  const match: Record<string, unknown> = { isActive: true };

  const categoryId = await resolveCategoryFilter(filters?.category);

  if (categoryId === "not_found") {
    return null;
  }

  if (categoryId) {
    match.category = categoryId;
  }

  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const price: Record<string, number> = {};

    if (filters.minPrice !== undefined) {
      price.$gte = filters.minPrice;
    }

    if (filters.maxPrice !== undefined) {
      price.$lte = filters.maxPrice;
    }

    match.price = price;
  }

  return match;
}

function toSearchResults(
  docs: Array<IProduct & { score?: number }>,
): ProductSearchResult[] {
  return docs.map((doc) => {
    const { score, ...product } = doc;

    return {
      product: product as IProduct,
      score: score ?? 0,
    };
  });
}

export async function semanticSearch(
  queryText: string,
  limit: number,
  filters?: SearchFilters,
): Promise<ProductSearchResult[]> {
  const matchFilter = await buildMatchFilter(filters);

  if (!matchFilter) {
    return [];
  }

  const queryVector = await generateEmbedding(queryText);

  const results = await Product.aggregate<IProduct & { score: number }>([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(limit * 10, 50),
        limit,
      },
    },
    { $match: matchFilter },
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  await Product.populate(results, { path: "category", select: "name slug" });

  return toSearchResults(results);
}

export async function textFallbackSearch(
  queryText: string,
  limit: number,
  filters?: SearchFilters,
): Promise<ProductSearchResult[]> {
  const matchFilter = await buildMatchFilter(filters);

  if (!matchFilter) {
    return [];
  }

  const products = await Product.find(
    {
      ...matchFilter,
      $text: { $search: queryText },
    },
    { score: { $meta: "textScore" } },
  )
    .populate("category", "name slug")
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean();

  return products.map((product) => ({
    product: product as unknown as IProduct,
    score: (product as { score?: number }).score ?? 0,
  }));
}

export async function hybridSearch(
  queryText: string,
  limit = DEFAULT_LIMIT,
  filters?: SearchFilters,
): Promise<ProductSearchResult[]> {
  const effectiveLimit = limit || DEFAULT_LIMIT;

  try {
    const semanticResults = await semanticSearch(
      queryText,
      effectiveLimit,
      filters,
    );

    if (semanticResults.length >= SEMANTIC_FALLBACK_THRESHOLD) {
      return semanticResults;
    }
  } catch {
    // Fall through to text search when vector search or embedding fails.
  }

  return textFallbackSearch(queryText, effectiveLimit, filters);
}
