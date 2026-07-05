import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid conversation ID");

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  conversationId: objectIdSchema.optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
