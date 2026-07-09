import { Types } from "mongoose";
import { Product, IProduct } from "../../models/Product";
import { Category } from "../../models/Category";
import { generateEmbedding } from "./embeddings";
import { env } from "../../config/env";

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

const FALLBACK_CANDIDATE_LIMIT = 500;

// Field weights: matches in the name/tags matter far more than in the
// long-form description, so a "men's bag" ranks above a "men's shirt"
// for the query "bags men".
const FIELD_WEIGHTS = {
  name: 6,
  tags: 5,
  category: 4,
  description: 1,
} as const;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "of",
  "to",
  "in",
  "on",
  "my",
  "me",
  "i",
]);

function tokenizeQuery(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)),
    ),
  );
}

function tokenVariants(token: string): string[] {
  const variants = new Set<string>([token]);

  if (token.endsWith("s")) {
    variants.add(token.slice(0, -1));
  } else {
    variants.add(`${token}s`);
  }

  return Array.from(variants);
}

function toWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Word-boundary, singular/plural tolerant match. Prevents "women" from
// matching the token "men" while still matching "bag" against "bags".
function wordsMatchToken(words: string[], token: string): boolean {
  const variants = tokenVariants(token);

  return words.some((word) =>
    variants.some(
      (variant) =>
        word === variant ||
        word.startsWith(variant) ||
        variant.startsWith(word),
    ),
  );
}

interface ScoredProduct {
  product: IProduct;
  score: number;
  coverage: number;
}

function scoreProduct(product: IProduct, tokens: string[]): ScoredProduct {
  const nameWords = toWords(product.name ?? "");
  const tagWords = toWords((product.tags ?? []).join(" "));
  const descriptionWords = toWords(product.description ?? "");

  const category = product.category as unknown as
    | { name?: string }
    | undefined;
  const categoryWords = toWords(
    category && typeof category === "object" ? category.name ?? "" : "",
  );

  let score = 0;
  let coverage = 0;

  for (const token of tokens) {
    let best = 0;

    if (wordsMatchToken(nameWords, token)) {
      best = Math.max(best, FIELD_WEIGHTS.name);
    }
    if (wordsMatchToken(tagWords, token)) {
      best = Math.max(best, FIELD_WEIGHTS.tags);
    }
    if (wordsMatchToken(categoryWords, token)) {
      best = Math.max(best, FIELD_WEIGHTS.category);
    }
    if (wordsMatchToken(descriptionWords, token)) {
      best = Math.max(best, FIELD_WEIGHTS.description);
    }

    if (best > 0) {
      score += best;
      coverage += 1;
    }
  }

  return { product, score, coverage };
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

  const tokens = tokenizeQuery(queryText);

  const candidates = await Product.find(matchFilter)
    .populate("category", "name slug")
    .limit(FALLBACK_CANDIDATE_LIMIT)
    .lean();

  const typedCandidates = candidates as unknown as IProduct[];

  // No usable tokens (e.g. only stop words): return by popularity.
  if (tokens.length === 0) {
    return typedCandidates
      .slice(0, limit)
      .map((product) => ({ product, score: 0 }));
  }

  const scored = typedCandidates
    .map((product) => scoreProduct(product, tokens))
    .filter((entry) => entry.coverage > 0);

  if (scored.length === 0) {
    return [];
  }

  // Prefer products that match the MOST query terms, so "bags men" ranks
  // items matching both "bag" and "men" above those matching just one.
  const maxCoverage = scored.reduce(
    (max, entry) => Math.max(max, entry.coverage),
    0,
  );

  return scored
    .filter((entry) => entry.coverage === maxCoverage)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (b.product.sold ?? 0) - (a.product.sold ?? 0);
    })
    .slice(0, limit)
    .map((entry) => ({ product: entry.product, score: entry.score }));
}

export async function hybridSearch(
  queryText: string,
  limit = DEFAULT_LIMIT,
  filters?: SearchFilters,
): Promise<ProductSearchResult[]> {
  const effectiveLimit = limit || DEFAULT_LIMIT;

  // Local dev: skip vector search entirely and use the improved text search.
  // ($vectorSearch only works on MongoDB Atlas with a vector index created.)
  if (!env.USE_VECTOR_SEARCH) {
    return textFallbackSearch(queryText, effectiveLimit, filters);
  }

  // Production (Atlas): try vector search, fall back to text if < 3 results.
  try {
    const results = await semanticSearch(queryText, effectiveLimit, filters);

    if (results.length >= SEMANTIC_FALLBACK_THRESHOLD) {
      return results;
    }

    return textFallbackSearch(queryText, effectiveLimit, filters);
  } catch (err) {
    console.error("Vector search failed, falling back to text:", err);
    return textFallbackSearch(queryText, effectiveLimit, filters);
  }
}
