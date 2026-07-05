import { apiRequest } from "./client";
import type { ChatProduct, ConversationSummary } from "./types";

export interface SendMessageInput {
  message: string;
  conversationId?: string;
}

interface SendMessageResponse {
  success: true;
  reply: string;
  conversationId: string;
  products?: ChatProduct[];
}

interface ConversationsResponse {
  success: true;
  conversations: ConversationSummary[];
}

interface ClearConversationResponse {
  success: true;
  message: string;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>("/chat/message", {
    method: "POST",
    body: input,
  });
}

export async function getConversations(): Promise<ConversationsResponse> {
  return apiRequest<ConversationsResponse>("/chat/conversations");
}

export async function clearConversation(
  conversationId: string,
): Promise<ClearConversationResponse> {
  return apiRequest<ClearConversationResponse>(
    `/chat/conversations/${conversationId}`,
    { method: "DELETE" },
  );
}
