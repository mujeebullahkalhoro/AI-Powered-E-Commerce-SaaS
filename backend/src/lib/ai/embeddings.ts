import { env } from "../../config/env";

export const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_MODEL = "models/gemini-embedding-001";
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${env.GOOGLE_API_KEY}`;

// gemini-embedding-001 only returns pre-normalized vectors at 3072 dims.
// At smaller dimensions (e.g. 768) we must L2-normalize for cosine similarity.
function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

interface EmbedContentResponse {
  embedding?: {
    values?: number[];
  };
  error?: {
    message?: string;
  };
}

export interface ProductEmbeddingInput {
  name: string;
  description: string;
  tags: string[];
  category: string;
}

function buildProductEmbeddingText(product: ProductEmbeddingInput): string {
  const tags = product.tags.length > 0 ? product.tags.join(", ") : "none";

  return `Product: ${product.name}. Category: ${product.category}. Description: ${product.description}. Tags: ${tags}`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const inputText = text.trim();

  if (!inputText) {
    throw new Error("Embedding generation failed: text must not be empty");
  }

  let response: Response;

  try {
    response = await fetch(EMBEDDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        content: {
          parts: [{ text: inputText }],
        },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Embedding generation failed: ${message}`);
  }

  let data: EmbedContentResponse;

  try {
    data = (await response.json()) as EmbedContentResponse;
  } catch {
    throw new Error(
      `Embedding generation failed: invalid response from Google API (status ${response.status})`,
    );
  }

  if (!response.ok) {
    const apiMessage = data.error?.message ?? response.statusText;
    throw new Error(
      `Embedding generation failed: Google API returned ${response.status} — ${apiMessage}`,
    );
  }

  const values = data.embedding?.values;

  if (!values || values.length === 0) {
    throw new Error(
      "Embedding generation failed: Google API response did not include embedding values",
    );
  }

  return normalize(values);
}

export async function generateProductEmbedding(
  product: ProductEmbeddingInput,
): Promise<number[]> {
  const text = buildProductEmbeddingText(product);

  return generateEmbedding(text);
}

if (require.main === module) {
  generateEmbedding("test product blue cotton t-shirt")
    .then((vec) => console.log("Length:", vec.length, "First 5:", vec.slice(0, 5)))
    .catch(console.error);
}
