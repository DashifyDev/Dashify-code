const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/dasify";

const tileSchema = new mongoose.Schema(
  {
    tileLink: String,
    tileText: String,
    tileContent: String,
    tileBackground: String,
    action: String,
    width: { type: String, required: true },
    height: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    isInsidePod: { type: Boolean, default: false },
    displayTitle: Boolean,
    titleX: Number,
    titleY: Number,
    editorHeading: String,
    backgroundAction: String,
    order: Number,
    mobileX: Number,
    mobileY: Number,
    mobileWidth: String,
    mobileHeight: String,
    createdAt: Date,
  },
  { strict: false }
);

const Tile = mongoose.models.Tile || mongoose.model("Tile", tileSchema);

const BATCH_SIZE = 500;

/**
 * Migration script: Add createdAt to existing tiles.
 *
 * Each tile's createdAt is extracted directly from its MongoDB ObjectId,
 * which already encodes the exact creation timestamp.
 * Oldest _id = oldest createdAt, newest _id = newest createdAt.
 */
async function migrateTilesCreatedAt() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all tiles without createdAt
    const tiles = await Tile.find(
      {
        $or: [{ createdAt: { $exists: false } }, { createdAt: null }],
      },
      { _id: 1 }
    ).lean();

    console.log(`Found ${tiles.length} tiles without createdAt`);

    if (tiles.length === 0) {
      console.log("All tiles already have createdAt");
      await mongoose.disconnect();
      return;
    }

    const startTime = Date.now();
    let bulkOps = [];
    let updatedCount = 0;

    async function flushBulk() {
      if (bulkOps.length === 0) return;
      const result = await Tile.bulkWrite(bulkOps, { ordered: false });
      updatedCount += result.modifiedCount;
      bulkOps = [];
    }

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      // Extract creation timestamp directly from ObjectId
      let createdAt = tile._id.getTimestamp();

      // Add +i seconds for each tile: first = +1s, second = +2s, etc.
      createdAt = new Date(createdAt.getTime() + (i + 1) * 1000);

      bulkOps.push({
        updateOne: {
          filter: { _id: tile._id },
          update: { $set: { createdAt } },
        },
      });

      if (bulkOps.length >= BATCH_SIZE) {
        await flushBulk();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  Processed ${i + 1}/${tiles.length} (${updatedCount} updated) [${elapsed}s]`);
      }
    }

    // Flush remaining
    await flushBulk();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nSuccessfully updated ${updatedCount} tiles with createdAt in ${totalTime}s`);
    console.log("Migration completed!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

async function main() {
  try {
    console.log("Starting createdAt migration for tiles...");
    await migrateTilesCreatedAt();
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateTilesCreatedAt };
