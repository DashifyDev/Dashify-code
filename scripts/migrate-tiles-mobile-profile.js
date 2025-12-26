const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dasify';

const tileSchema = new mongoose.Schema({
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
  mobileHeight: String
}, { strict: false });

const Tile = mongoose.models.Tile || mongoose.model('Tile', tileSchema);

async function migrateTiles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all tiles that don't have mobile profile fields
    const tilesToUpdate = await Tile.find({
      $or: [
        { mobileWidth: { $exists: false } },
        { mobileHeight: { $exists: false } },
        { mobileX: { $exists: false } },
        { mobileY: { $exists: false } },
        { order: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${tilesToUpdate.length} tiles to update`);

    if (tilesToUpdate.length === 0) {
      console.log('✅ All tiles already have mobile profile fields');
      await mongoose.disconnect();
      return;
    }

    const windowWidth = 375; // Default mobile width
    let updatedCount = 0;

    for (const tile of tilesToUpdate) {
      const updates = {};

      // Set mobile profile defaults if missing
      if (!tile.mobileWidth) {
        updates.mobileWidth = `${windowWidth - 32}px`;
      }
      if (!tile.mobileHeight) {
        updates.mobileHeight = tile.height || '150px';
      }
      if (tile.mobileX === undefined || tile.mobileX === null) {
        updates.mobileX = 0;
      }
      if (tile.mobileY === undefined || tile.mobileY === null) {
        // Use order or index to calculate approximate position
        const order = tile.order || 0;
        updates.mobileY = order * 166;
      }
      if (tile.order === undefined || tile.order === null) {
        // Try to infer order from creation date or set default
        updates.order = 0; // Will be recalculated on next access
      }

      await Tile.updateOne({ _id: tile._id }, { $set: updates });
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} tiles with mobile profile fields`);
    console.log('📱 Mobile profile migration completed!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function main() {
  try {
    console.log('🚀 Starting tile mobile profile migration...');
    await migrateTiles();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateTiles };

