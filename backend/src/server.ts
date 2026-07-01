import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
