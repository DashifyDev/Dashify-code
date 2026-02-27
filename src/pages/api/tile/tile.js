import "@/utils/db"; // Initialize MongoDB connection
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";
import { getUserPlan } from "@/services/subscriptionService";
import { FREE_PLAN_MAX_TILES_PER_BOARD } from "@/constants/plans";

const tile = async (req, res) => {
  try {
    switch (req.method) {
      case "POST":
        const boardId = req.body.dashboardId;
        const data = req.body;
        if (req.body._id) {
          delete data._id;
        }
        const dashboard = await Dashboard.findById(boardId).select("userId").lean();
        if (!dashboard) {
          return res.status(404).json({ message: "Dashboard not found" });
        }

        // Set createdAt only for new tiles (not copies that already have it)
        if (!data.createdAt) {
          data.createdAt = new Date();
        }
        const tile = await Tile.create(data);

        let isPro = true;
        if (dashboard.userId) {
          const plan = await getUserPlan(dashboard.userId);
          isPro = plan.isPro;
        }

        const updateFilter =
          dashboard.userId && !isPro
            ? {
                _id: boardId,
                $expr: { $lt: [{ $size: "$tiles" }, FREE_PLAN_MAX_TILES_PER_BOARD] },
              }
            : { _id: boardId };

        const updatedDashBoard = await Dashboard.updateOne(updateFilter, {
          $push: { tiles: tile._id },
        });

        if (updatedDashBoard) {
          if (updatedDashBoard.modifiedCount > 0 || updatedDashBoard.nModified > 0) {
            return res.status(200).json(tile);
          }

          await Tile.deleteOne({ _id: tile._id });
          if (dashboard.userId && !isPro) {
            return res.status(403).json({ message: "Tile limit reached" });
          }
          return res.status(400).json("Error At add tile");
        }
        return res.status(400).json("Error At add tile");
        break;

      default:
        break;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ Message: "server Error" });
  }
};
export default tile;
