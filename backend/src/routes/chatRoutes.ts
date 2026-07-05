import { Router } from "express";
import { protect } from "../middleware/auth";
import { chatLimiter } from "../middleware/rateLimit";
import { validate } from "../lib/validations/auth";
import { sendMessageSchema } from "../lib/validations/chat";
import {
  sendMessage,
  getConversations,
  clearConversation,
} from "../controllers/chatController";

const router = Router();

router.use(protect);
router.use(chatLimiter);

router.post("/message", validate(sendMessageSchema), sendMessage);
router.get("/conversations", getConversations);
router.delete("/conversations/:id", clearConversation);

export default router;
