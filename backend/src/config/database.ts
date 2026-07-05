import mongoose from "mongoose";
import { env } from "./env";

let reconnectTimer: NodeJS.Timeout | null = null;

export async function connectDB(): Promise<void> {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    if (mongoose.connection.readyState === 1) {
      return;
    }

    try {
      console.log("MongoDB attempting reconnect...");
      await mongoose.connect(env.MONGODB_URI);
    } catch (error) {
      console.error("MongoDB reconnect failed:", error);
      scheduleReconnect();
    }
  }, 5000);
}

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected event");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
  scheduleReconnect();
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("close", () => {
  console.warn("MongoDB connection closed");
});
