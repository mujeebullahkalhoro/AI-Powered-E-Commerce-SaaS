import { Request, Response } from "express";
import { Types } from "mongoose";
import OpenAI from "openai";
import { Conversation } from "../models/Conversation";
import { asyncHandler } from "../middleware/asyncHandler";
import { groqClient, FAST_MODEL } from "../lib/ai/groq";
import { hybridSearch } from "../lib/ai/vectorSearch";
import { SendMessageInput } from "../lib/validations/chat";

import { archiveOverflowMessages } from "../lib/conversationArchive";

const SYSTEM_MESSAGE =
  "You are a helpful shopping assistant for our store. When the user asks about products, use the search function to find relevant items. Always be concise and suggest specific products when possible.";

const SEARCH_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Search the store catalog for products matching a query with optional filters.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Product search query",
          },
          maxPrice: {
            type: "number",
            description: "Maximum price filter",
          },
          category: {
            type: "string",
            description: "Category slug filter",
          },
        },
        required: ["query"],
      },
    },
  },
];

interface SearchProductsArgs {
  query: string;
  maxPrice?: number;
  category?: string;
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
  const results = await hybridSearch(args.query, 5, {
    maxPrice: args.maxPrice,
    category: args.category,
  });

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

async function runShoppingAssistant(
  history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  userMessage: string,
): Promise<{ reply: string; products?: ChatProduct[] }> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_MESSAGE },
    ...history,
    { role: "user", content: userMessage },
  ];

  let products: ChatProduct[] | undefined;
  const maxToolRounds = 3;

  for (let round = 0; round < maxToolRounds; round += 1) {
    let response: OpenAI.Chat.Completions.ChatCompletion;

    try {
      response = await groqClient.chat.completions.create({
        model: FAST_MODEL,
        messages,
        tools: SEARCH_TOOLS,
        tool_choice: "auto",
        max_tokens: 500,
      });
    } catch (error) {
      throw new Error(`Chat assistant request failed: ${getErrorMessage(error)}`);
    }

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error("Chat assistant returned an empty response");
    }

    if (assistantMessage.tool_calls?.length) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") {
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

        let args: SearchProductsArgs;

        try {
          args = JSON.parse(toolCall.function.arguments) as SearchProductsArgs;
        } catch {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: "Invalid search arguments",
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

      continue;
    }

    const reply = assistantMessage.content?.trim();

    if (!reply) {
      throw new Error("Chat assistant returned an empty reply");
    }

    return { reply, products };
  }

  throw new Error("Chat assistant exceeded maximum tool call rounds");
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
