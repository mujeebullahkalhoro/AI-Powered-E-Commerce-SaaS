import mongoose, { Document, Schema, Types } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  user: Types.ObjectId;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationMessageSchema = new Schema<IConversationMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const conversationSchema = new Schema<IConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: {
      type: [conversationMessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
