import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  GOOGLE_API_KEY: string;
  XAI_API_KEY: string;
  CLIENT_URL: string;
}

const requiredVars = [
  "PORT",
  "NODE_ENV",
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GOOGLE_API_KEY",
  "XAI_API_KEY",
  "CLIENT_URL",
] as const;

function loadEnv(): EnvConfig {
  const missing = requiredVars.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = Number(process.env.PORT);

  if (Number.isNaN(port)) {
    throw new Error("PORT must be a valid number");
  }

  return {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV!,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
    XAI_API_KEY: process.env.XAI_API_KEY!,
    CLIENT_URL: process.env.CLIENT_URL!,
  };
}

export const env = loadEnv();
