import connectMongo from "@/utils/db";
import Tile from "@/models/tile";

const batchUpdate = async (req, res) => {
  try {
    await connectMongo();

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Invalid input: updates must be a non-empty array" });
    }

    // Validate each update has tileId and data
    for (const update of updates) {
      if (!update.tileId || !update.data) {
        return res.status(400).json({ 
          message: "Invalid input: each update must have tileId and data" 
        });
      }
    }

    // Perform batch update using Promise.all for parallel execution
    const updatePromises = updates.map(async (update) => {
      try {
        const updated = await Tile.findByIdAndUpdate(
          update.tileId,
          { $set: update.data },
          { new: true }
        );
        
        if (!updated) {
          return { tileId: update.tileId, error: "Tile not found" };
        }
        
        return { tileId: update.tileId, data: updated };
      } catch (error) {
        console.error(`Error updating tile ${update.tileId}:`, error);
        return { tileId: update.tileId, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);

    // Check if any updates failed
    const failedUpdates = results.filter((r) => r.error);
    if (failedUpdates.length > 0) {
      console.error("Some updates failed:", failedUpdates);
      // Still return success with partial results, but log errors
    }

    // Return successful updates
    const successfulUpdates = results.filter((r) => !r.error);
    
    res.status(200).json({
      message: "Batch update completed",
      updated: successfulUpdates.length,
      failed: failedUpdates.length,
      results: successfulUpdates,
      errors: failedUpdates.length > 0 ? failedUpdates : undefined,
    });
  } catch (err) {
    console.error("Batch update error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export default batchUpdate;

