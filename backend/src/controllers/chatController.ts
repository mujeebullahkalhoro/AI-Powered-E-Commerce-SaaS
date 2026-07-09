import { Request, Response } from "express";
import { Types } from "mongoose";
import OpenAI from "openai";
import { Conversation } from "../models/Conversation";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { asyncHandler } from "../middleware/asyncHandler";
import { groqClient, FAST_MODEL } from "../lib/ai/groq";
import { hybridSearch } from "../lib/ai/vectorSearch";
import { SendMessageInput } from "../lib/validations/chat";

import { archiveOverflowMessages } from "../lib/conversationArchive";

const SYSTEM_MESSAGE =
  "You are a helpful shopping assistant for our store. For product recommendations, call searchProducts once with a clear query string. Never invent product or category names — only use data returned by tools. Call at most one tool per user message, then reply in plain language. Keep answers concise.";

const CHAT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Search the store catalog for products matching a natural-language query.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Product search query, e.g. 'wireless headphones under 50 dollars in electronics'",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listCategories",
      description:
        "List product categories in the store that currently have active products.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

interface SearchProductsArgs {
  query: string;
}

function normalizeSearchArgs(raw: Record<string, unknown>): SearchProductsArgs | null {
  const query = typeof raw.query === "string" ? raw.query.trim() : "";

  if (!query) {
    return null;
  }

  return { query };
}

interface CategoryWithCount {
  name: string;
  slug: string;
  count: number;
}

async function getCategoriesWithProducts(): Promise<CategoryWithCount[]> {
  const categories = await Category.find({ isActive: true })
    .select("name slug")
    .sort({ name: 1 });

  if (categories.length === 0) {
    return [];
  }

  const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countByCategory = new Map(
    counts.map((entry) => [entry._id.toString(), entry.count]),
  );

  return categories
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      count: countByCategory.get(category._id.toString()) ?? 0,
    }))
    .filter((category) => category.count > 0);
}

function isCategoryListingQuestion(message: string): boolean {
  const text = message.toLowerCase();

  const mentionsCategories =
    /\b(categor(y|ies)|departments?|collections?|sections?)\b/.test(text) ||
    /\bwhat (?:do you|can i) (?:sell|shop|carry)\b/.test(text) ||
    /\bwhat(?:'s| is) (?:in )?(?:the |your )?store\b/.test(text);

  if (!mentionsCategories) {
    return false;
  }

  const isProductSearch =
    /\b(find|search|looking for|recommend|suggest|buy|need|want)\b/.test(text) &&
    /\b(in|from|under|below)\b/.test(text);

  return !isProductSearch;
}

async function buildCategoryListingReply(): Promise<string> {
  const categories = await getCategoriesWithProducts();

  if (categories.length > 0) {
    const lines = categories
      .map(
        (category) =>
          `• ${category.name} (${category.count} product${category.count === 1 ? "" : "s"})`,
      )
      .join("\n");

    return `Products are currently available in these categories:\n\n${lines}\n\nBrowse them on the Products page, or tell me what you'd like to shop for.`;
  }

  const activeCategoryCount = await Category.countDocuments({ isActive: true });

  if (activeCategoryCount === 0) {
    return "We don't have any product categories set up in the store yet.";
  }

  return "We have categories in the store, but no products are listed yet. Check back soon or browse /products later.";
}

async function executeListCategories(): Promise<string> {
  const categories = await getCategoriesWithProducts();

  if (categories.length === 0) {
    const activeCategoryCount = await Category.countDocuments({ isActive: true });

    if (activeCategoryCount === 0) {
      return "No active categories are configured in the store yet.";
    }

    return "Categories exist but no active products are listed yet.";
  }

  return categories
    .map(
      (category) =>
        `${category.name} (slug: ${category.slug}, ${category.count} product${category.count === 1 ? "" : "s"})`,
    )
    .join("\n");
}

interface ChatProduct {
  id: string;
  name: string;
  price: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function executeSearchProducts(
  args: SearchProductsArgs,
): Promise<{ resultString: string; products: ChatProduct[] }> {
  const results = await hybridSearch(args.query, 5);

  const products = results.map(({ product }) => ({
    id: product._id.toString(),
    name: product.name,
    price: product.price,
  }));

  if (products.length === 0) {
    return {
      resultString: "No products found matching that query.",
      products: [],
    };
  }

  const resultString = products
    .map(
      (product) =>
        `id: ${product.id}, name: ${product.name}, price: $${product.price.toFixed(2)}`,
    )
    .join("\n");

  return { resultString, products };
}

function buildFallbackReply(products?: ChatProduct[]): string {
  if (products && products.length > 0) {
    const preview = products
      .slice(0, 3)
      .map((product) => product.name)
      .join(", ");
    return `I found ${products.length} product${products.length === 1 ? "" : "s"} for you, including ${preview}. Take a look at the suggestions below.`;
  }

  return "I couldn't find products matching that request. Try different keywords or browse our product catalog.";
}

async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolChoice: "auto" | "none",
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    return await groqClient.chat.completions.create({
      model: FAST_MODEL,
      messages,
      tools: CHAT_TOOLS,
      tool_choice: toolChoice,
      max_tokens: 500,
    });
  } catch (error) {
    throw new Error(`Chat assistant request failed: ${getErrorMessage(error)}`);
  }
}

async function executeToolCalls(
  assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<ChatProduct[] | undefined> {
  let products: ChatProduct[] | undefined;

  messages.push(assistantMessage);

  for (const toolCall of assistantMessage.tool_calls ?? []) {
    if (toolCall.type !== "function") {
      continue;
    }

    if (toolCall.function.name === "listCategories") {
      const resultString = await executeListCategories();

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: resultString,
      });
      continue;
    }

    if (toolCall.function.name !== "searchProducts") {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: `Unknown tool: ${toolCall.function.name}`,
      });
      continue;
    }

    let parsedArgs: Record<string, unknown>;

    try {
      parsedArgs = JSON.parse(toolCall.function.arguments) as Record<
        string,
        unknown
      >;
    } catch {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: "Invalid search arguments",
      });
      continue;
    }

    const args = normalizeSearchArgs(parsedArgs);

    if (!args) {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: "Invalid search arguments: query is required",
      });
      continue;
    }

    const searchResult = await executeSearchProducts(args);

    if (searchResult.products.length > 0) {
      products = searchResult.products;
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: searchResult.resultString,
    });
  }

  return products;
}

async function runShoppingAssistant(
  history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  userMessage: string,
): Promise<{ reply: string; products?: ChatProduct[] }> {
  if (isCategoryListingQuestion(userMessage)) {
    return { reply: await buildCategoryListingReply() };
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_MESSAGE },
    ...history,
    { role: "user", content: userMessage },
  ];

  let products: ChatProduct[] | undefined;

  const initialResponse = await createChatCompletion(messages, "auto");
  const initialMessage = initialResponse.choices[0]?.message;

  if (!initialMessage) {
    throw new Error("Chat assistant returned an empty response");
  }

  if (initialMessage.tool_calls?.length) {
    const toolNames = initialMessage.tool_calls
      .filter((toolCall) => toolCall.type === "function")
      .map((toolCall) => toolCall.function.name);

    if (
      toolNames.includes("listCategories") &&
      !toolNames.includes("searchProducts")
    ) {
      return { reply: await buildCategoryListingReply() };
    }

    const searchedProducts = await executeToolCalls(initialMessage, messages);
    if (searchedProducts) {
      products = searchedProducts;
    }

    const finalResponse = await createChatCompletion(messages, "none");
    const finalMessage = finalResponse.choices[0]?.message;
    const reply = finalMessage?.content?.trim();

    if (reply) {
      return { reply, products };
    }

    return { reply: buildFallbackReply(products), products };
  }

  if (isCategoryListingQuestion(userMessage)) {
    return { reply: await buildCategoryListingReply() };
  }

  const reply = initialMessage.content?.trim();

  if (!reply) {
    return { reply: buildFallbackReply(), products };
  }

  return { reply, products };
}

function buildHistoryMessages(
  messages: { role: "user" | "assistant"; content: string }[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationId } = req.body as SendMessageInput;
  const userId = req.user!.id;

  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, user: userId })
    : null;

  if (conversationId && !conversation) {
    res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
    return;
  }

  if (!conversation) {
    conversation = await Conversation.create({
      user: userId,
      messages: [],
    });
  }

  const history = buildHistoryMessages(conversation.messages);
  const { reply, products } = await runShoppingAssistant(history, message);
  const now = new Date();

  conversation.messages.push(
    { role: "user", content: message, timestamp: now },
    { role: "assistant", content: reply, timestamp: now },
  );

  const archived = archiveOverflowMessages(
    conversation.messages,
    conversation.archivedMessages ?? [],
  );
  conversation.messages = archived.messages;
  conversation.archivedMessages = archived.archived;

  await conversation.save();

  res.status(200).json({
    success: true,
    reply,
    conversationId: conversation._id,
    ...(products && products.length > 0 ? { products } : {}),
  });
});

export const getConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const conversations = await Conversation.find({ user: req.user!.id })
      .sort({ updatedAt: -1 })
      .select({ messages: { $slice: -1 }, updatedAt: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      conversations: conversations.map((conversation) => {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];

        return {
          id: conversation._id,
          lastMessage: lastMessage?.content ?? null,
          lastMessageRole: lastMessage?.role ?? null,
          timestamp: lastMessage?.timestamp ?? conversation.updatedAt,
          createdAt: conversation.createdAt,
        };
      }),
    });
  },
);

export const clearConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conversationId = String(req.params.id);

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
      return;
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      user: req.user!.id,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  },
);
