import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import connectMongo from "@/utils/db";
import mongoose from "mongoose";
import { getDashboardMinimal } from "@/utils/databaseIndexes";

const getDashboardData = async (req, res) => {
  try {
    await connectMongo();
    const { id } = req.query;
    switch (req.method) {
      case "GET":
        if (!id) {
          return res.status(400).json({ message: "Dashboard ID is required" });
        }
        const data = await getDashboardMinimal(id);

        if (data) {
          res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=600, max-age=60",
          );
          res.setHeader("ETag", `"${id}-${data.updatedAt || Date.now()}"`);
          res.setHeader("Vary", "Accept-Encoding");

          const ifNoneMatch = req.headers["if-none-match"];
          if (ifNoneMatch === `"${id}-${data.updatedAt || Date.now()}"`) {
            return res.status(304).end();
          }

          return res.status(200).json(data);
        } else {
          res.status(404).json({ message: "Dashboard not found" });
        }
        break;

      case "DELETE":
        // validate id first
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid dashboard id" });
        }

        const DeletedDashboard = await Dashboard.findByIdAndDelete(id);
        if (!DeletedDashboard) {
          return res.status(404).json({ message: "Dashboard not found" });
        }

        const tilesTodelete = Array.isArray(DeletedDashboard.tiles)
          ? DeletedDashboard.tiles
          : [];
        if (tilesTodelete.length > 0) {
          await Tile.deleteMany({ _id: { $in: tilesTodelete } });
        }

        return res.status(200).json(DeletedDashboard);
        break;

      case "PATCH":
        const updatedData = req.body;
        const updated = await Dashboard.findByIdAndUpdate(
          { _id: id },
          { $set: updatedData },
          { new: true },
        );
        if (updated) {
          res.status(200).json(updated);
        } else {
          res.status(200).json({ message: "Error At delete" });
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Dashboard API Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default getDashboardData;
