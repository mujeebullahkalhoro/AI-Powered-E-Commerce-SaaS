import mongoose from "mongoose";

const SOURCE_URI = "mongodb://127.0.0.1:27017/ai-ecommerce";
const TARGET_URI =
  "mongodb://127.0.0.1:27018/ai-ecommerce?replicaSet=rs0";

const COLLECTIONS = [
  "users",
  "categories",
  "products",
  "carts",
  "wishlists",
  "orders",
  "reviews",
  "conversations",
];

async function waitForPrimary(uri: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const connection = await mongoose.createConnection(uri).asPromise();
    const admin = connection.db?.admin();

    if (admin) {
      try {
        const status = await admin.command({ replSetGetStatus: 1 });
        const member = status.members?.[0];

        if (member?.stateStr === "PRIMARY") {
          await connection.close();
          return;
        }
      } catch {
        // Replica set may still be starting.
      }
    }

    await connection.close();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Target replica set did not become PRIMARY in time.");
}

async function migrateCollection(
  sourceDb: mongoose.mongo.Db,
  targetDb: mongoose.mongo.Db,
  name: string,
): Promise<number> {
  const docs = await sourceDb.collection(name).find({}).toArray();

  if (docs.length === 0) {
    return 0;
  }

  await targetDb.collection(name).deleteMany({});
  await targetDb.collection(name).insertMany(docs, { ordered: false });
  return docs.length;
}

async function main(): Promise<void> {
  await waitForPrimary(TARGET_URI);

  const source = await mongoose.createConnection(SOURCE_URI).asPromise();
  const target = await mongoose.createConnection(TARGET_URI).asPromise();

  const sourceDb = source.db;
  const targetDb = target.db;

  if (!sourceDb || !targetDb) {
    throw new Error("Failed to open source or target database.");
  }

  let total = 0;

  for (const collection of COLLECTIONS) {
    const count = await migrateCollection(sourceDb, targetDb, collection);
    console.log(`Migrated ${count} documents from ${collection}`);
    total += count;
  }

  console.log(`Done. Migrated ${total} documents to ${TARGET_URI}`);

  await source.close();
  await target.close();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
