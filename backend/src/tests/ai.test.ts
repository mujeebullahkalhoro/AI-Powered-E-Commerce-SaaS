import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    responses = {
      create: createMock,
    };
  },
}));

describe("Groq AI service", () => {
  beforeEach(() => {
    vi.resetModules();
    createMock.mockReset();
  });

  it("generateProductDescription returns model text", async () => {
    createMock.mockResolvedValue({
      output_text: "A premium product description.",
    });

    const { generateProductDescription } = await import("../lib/ai/groq.js");
    const description = await generateProductDescription(
      "Headphones",
      "Electronics",
      ["wireless"],
    );

    expect(description).toBe("A premium product description.");
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("generateSEO parses JSON response", async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        seoTitle: "Great Headphones",
        metaDescription: "Buy the best headphones online today.",
        keywords: ["headphones", "wireless", "audio", "music", "electronics"],
      }),
    });

    const { generateSEO } = await import("../lib/ai/groq.js");
    const seo = await generateSEO(
      "Headphones",
      "Premium wireless headphones",
      "Electronics",
    );

    expect(seo.seoTitle).toBe("Great Headphones");
    expect(seo.keywords).toHaveLength(5);
  });
});
