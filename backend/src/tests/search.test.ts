import { describe, it, expect, vi, beforeEach } from "vitest";
import { hybridSearch } from "../lib/ai/vectorSearch";

vi.mock("../lib/ai/embeddings", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(768).fill(0.1)),
}));

vi.mock("../models/Product", () => ({
  Product: {
    aggregate: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    populate: vi.fn(),
  },
}));

vi.mock("../models/Category", () => ({
  Category: {
    findOne: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    }),
  },
}));

describe("hybridSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when category slug is not found", async () => {
    const results = await hybridSearch("headphones", 5, {
      category: "unknown-category",
    });

    expect(results).toEqual([]);
  });
});
