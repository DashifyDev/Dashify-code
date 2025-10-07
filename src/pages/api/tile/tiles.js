import connectMongo from "@/utils/db";
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";

const tiles = async (req, res) => {
  try {
    await connectMongo();

    switch (req.method) {
      case "POST":
        const { dashboardId, tiles } = req.body;

        if (!dashboardId || !Array.isArray(tiles)) {
          return res.status(400).json({ message: "Invalid input data" });
        }

        const sanitizedTiles = tiles.map(tile => {
          const { _id, ...rest } = tile;
          return rest;
        });

        const createdTiles = await Tile.insertMany(sanitizedTiles);

        const tileIds = createdTiles.map(tile => tile._id);

        const updatedDashboard = await Dashboard.updateOne(
          { _id: dashboardId },
          { $push: { tiles: { $each: tileIds } } }
        );

        if (updatedDashboard.modifiedCount > 0) {
          res.status(200).json({ message: "Tiles added successfully", tiles: createdTiles });
        } else {
          res.status(400).json({ message: "Failed to update dashboard with tile IDs" });
        }
        break;

      default:
        res.status(405).json({ message: "Method not allowed" });
        break;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default tiles;
