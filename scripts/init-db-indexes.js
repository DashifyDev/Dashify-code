
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dasify";

async function createDatabaseIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    await db.collection("dashboards").createIndex({ userId: 1 });
    await db.collection("dashboards").createIndex({ sessionId: 1 });
    await db.collection("dashboards").createIndex({ position: 1 });
    await db.collection("dashboards").createIndex({ hasAdminAdded: 1 });
    await db.collection("dashboards").createIndex({ createdAt: -1 });

    await db.collection("dashboards").createIndex({ userId: 1, position: 1 });

    await db
      .collection("dashboards")
      .createIndex({ sessionId: 1, createdAt: 1 });

    await db.collection("tiles").createIndex({ isInsidePod: 1 });
    await db.collection("tiles").createIndex({ x: 1, y: 1 }); 

    await db.collection("pods").createIndex({ isPod: 1 });
    await db.collection("pods").createIndex({ x: 1, y: 1 }); 

    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    console.log("Database indexes created successfully!");
  } catch (error) {
    console.error("Error creating database indexes:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  try {
    console.log("🚀 Starting database index initialization...");

    await createDatabaseIndexes();

    console.log("✅ Database indexes initialized successfully!");
    console.log("📊 Performance optimizations applied:");
    console.log("   - Dashboard queries optimized with compound indexes");
    console.log("   - Tile spatial queries indexed");
    console.log("   - User lookup optimized");
    console.log("   - Session-based queries indexed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database indexes:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
