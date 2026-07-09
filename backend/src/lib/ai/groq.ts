// Groq API (https://api.groq.com/openai/v1)
// Models: llama-3.3-70b-versatile (complex) / llama-3.1-8b-instant (fast)
// Using OpenAI-compatible SDK with Groq baseURL
import OpenAI from "openai";
import { env } from "../../config/env";

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.GROQ_API_KEY,
});

/** Free tier: 30 RPM, 1,000 RPD — better copy & JSON for descriptions/SEO */
const QUALITY_MODEL = "llama-3.3-70b-versatile";

/** Free tier: 30 RPM, 14,400 RPD — high-volume tags & summaries */
export const FAST_MODEL = "llama-3.1-8b-instant";

export const groqClient = groq;

interface SEOResult {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const MAX_PRODUCT_DESCRIPTION_LINES = 5;
const MAX_PRODUCT_DESCRIPTION_WORDS = 80;

function enforceProductDescriptionLength(description: string): string {
  const normalized = description
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return normalized;
  }

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  const limitedByLines = sentences
    .slice(0, MAX_PRODUCT_DESCRIPTION_LINES)
    .join(" ")
    .trim();

  const words = limitedByLines.split(/\s+/);
  if (words.length <= MAX_PRODUCT_DESCRIPTION_WORDS) {
    return limitedByLines;
  }

  return `${words.slice(0, MAX_PRODUCT_DESCRIPTION_WORDS).join(" ").trim()}.`;
}

function extractResponseText(content: string | null | undefined): string {
  if (!content?.trim()) {
    throw new Error("Groq API returned an empty response");
  }

  return content.trim();
}

function parseJsonPayload<T>(raw: string, context: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new Error(
      `${context}: failed to parse JSON response — ${getErrorMessage(error)}`,
    );
  }
}

async function createGroqChatCompletion(
  system: string,
  user: string,
  maxTokens: number,
  model: string,
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    });

    return extractResponseText(response.choices[0]?.message?.content);
  } catch (error) {
    throw new Error(`Groq API request failed: ${getErrorMessage(error)}`);
  }
}

export async function generateProductDescription(
  name: string,
  category: string,
  attributes: string[],
): Promise<string> {
  const attributeList =
    attributes.length > 0 ? attributes.join(", ") : "none specified";

  const description = await createGroqChatCompletion(
    "You are a professional e-commerce copywriter. Keep product copy short and scannable.",
    `Write a product description for: ${name} in ${category} with these attributes: ${attributeList}.

Strict rules:
- Maximum 5 lines total
- Maximum 80 words
- One short paragraph only
- No headings, bullet points, markdown, or line breaks
- Return plain sentences only`,
    120,
    QUALITY_MODEL,
  );

  return enforceProductDescriptionLength(description);
}

export async function generateSEO(
  name: string,
  description: string,
  category: string,
): Promise<SEOResult> {
  const raw = await createGroqChatCompletion(
    "You are an SEO expert. Respond only with valid JSON, no markdown.",
    `Generate SEO metadata for this product.
Name: ${name}
Category: ${category}
Description: ${description}

Return JSON with:
- seoTitle (max 60 characters)
- metaDescription (max 160 characters)
- keywords (array of 5-8 strings)`,
    500,
    QUALITY_MODEL,
  );

  const parsed = parseJsonPayload<SEOResult>(raw, "generateSEO");

  if (
    typeof parsed.seoTitle !== "string" ||
    typeof parsed.metaDescription !== "string" ||
    !Array.isArray(parsed.keywords) ||
    !parsed.keywords.every((keyword) => typeof keyword === "string")
  ) {
    throw new Error(
      "generateSEO: response JSON must include seoTitle, metaDescription, and keywords[]",
    );
  }

  return {
    seoTitle: parsed.seoTitle.trim(),
    metaDescription: parsed.metaDescription.trim(),
    keywords: parsed.keywords.map((keyword) => keyword.trim()).filter(Boolean),
  };
}

export async function generateTags(
  name: string,
  description: string,
  category: string,
): Promise<string[]> {
  const raw = await createGroqChatCompletion(
    "You are a product tagging system. Respond only with a JSON array of strings, no markdown.",
    `Generate 5-8 relevant search tags for this product.
Name: ${name}
Category: ${category}
Description: ${description}`,
    300,
    FAST_MODEL,
  );

  const parsed = parseJsonPayload<string[]>(raw, "generateTags");

  if (
    !Array.isArray(parsed) ||
    !parsed.every((tag) => typeof tag === "string")
  ) {
    throw new Error("generateTags: response must be a JSON array of strings");
  }

  const tags = parsed.map((tag) => tag.trim()).filter(Boolean);

  if (tags.length === 0) {
    throw new Error("generateTags: response array must not be empty");
  }

  return tags;
}

export async function summarizeReviews(
  reviews: { rating: number; comment: string }[],
): Promise<string> {
  if (reviews.length === 0) {
    return "No reviews yet.";
  }

  const shouldTruncate = reviews.length > 20;
  const reviewLines = reviews.map((review, index) => {
    const comment =
      shouldTruncate && review.comment.length > 200
        ? `${review.comment.slice(0, 200)}...`
        : review.comment;

    return `${index + 1}. Rating: ${review.rating}/5 — ${comment}`;
  });

  return createGroqChatCompletion(
    "You are a helpful review summarizer.",
    `Summarize these ${reviews.length} customer reviews in 2-3 sentences covering common praise and complaints.

${reviewLines.join("\n")}`,
    300,
    FAST_MODEL,
  );
}
