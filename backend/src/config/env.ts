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
  GROQ_API_KEY: string;
  CLIENT_URL: string;
  API_PUBLIC_URL: string;
  USE_LOCAL_UPLOAD: boolean;
  USE_VECTOR_SEARCH: boolean;
  JWT_ACCESS_EXPIRES_IN: string;
  SMTP_HOST: string | null;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string | null;
  SMTP_PASS: string | null;
  SMTP_FROM: string | null;
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
  "GROQ_API_KEY",
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

  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpHost = process.env.SMTP_HOST?.trim() || null;
  const smtpUser = process.env.SMTP_USER?.trim() || null;
  const smtpPass = process.env.SMTP_PASS?.trim() || null;
  const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser;
  const smtpSecure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && smtpPort === 465);

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
    GROQ_API_KEY: process.env.GROQ_API_KEY!,
    CLIENT_URL: process.env.CLIENT_URL!,
    API_PUBLIC_URL:
      process.env.API_PUBLIC_URL?.trim() || `http://127.0.0.1:${port}`,
    USE_LOCAL_UPLOAD:
      process.env.USE_LOCAL_UPLOAD === "true" ||
      (process.env.NODE_ENV === "development" &&
        process.env.USE_LOCAL_UPLOAD !== "false"),
    USE_VECTOR_SEARCH: process.env.USE_VECTOR_SEARCH === "true",
    JWT_ACCESS_EXPIRES_IN:
      process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "2h",
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: smtpSecure,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    SMTP_FROM: smtpFrom,
  };
}

export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

export const env = loadEnv();
