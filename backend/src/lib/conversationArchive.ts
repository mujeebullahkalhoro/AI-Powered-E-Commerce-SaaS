import { IConversationMessage } from "../models/Conversation";

export const MAX_ACTIVE_MESSAGES = 50;

export function archiveOverflowMessages(
  messages: IConversationMessage[],
  archived: IConversationMessage[],
): { messages: IConversationMessage[]; archived: IConversationMessage[] } {
  if (messages.length <= MAX_ACTIVE_MESSAGES) {
    return { messages, archived };
  }

  const overflowCount = messages.length - MAX_ACTIVE_MESSAGES;
  const toArchive = messages.slice(0, overflowCount);

  return {
    messages: messages.slice(overflowCount),
    archived: [...archived, ...toArchive],
  };
}
