import express, { Router } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import searchRoutes from "./routes/searchRoutes";
import aiRoutes from "./routes/aiRoutes";
import chatRoutes from "./routes/chatRoutes";
import healthRoutes from "./routes/healthRoutes";
import { stripeWebhook } from "./controllers/orderController";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
    // Frontend runs on a different origin in development (localhost:3000),
    // so uploaded product images must be allowed cross-origin.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.post(
  "/api/v1/orders/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/upload", uploadRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/products/:productId/reviews", reviewRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/wishlist", wishlistRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/search", searchRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/chat", chatRoutes);

app.use("/api/v1", apiRouter);
app.use("/health", healthRoutes);

app.use(errorHandler);

export default app;
