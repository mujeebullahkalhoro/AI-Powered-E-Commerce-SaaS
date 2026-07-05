import express, { Router } from "express";
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
import { stripeWebhook } from "./controllers/orderController";

const app = express();

app.use(helmet());
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.use("/api/v1", apiRouter);

app.use(errorHandler);

export default app;
