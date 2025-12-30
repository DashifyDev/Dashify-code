import "@/utils/db"; // Initialize MongoDB connection
import Pod from "@/models/pod";
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";
import mongoose from "mongoose";

const createPod = async (req, res) => {
  try {
    switch (req.method) {
      case "POST":
        const boardId = req.body.dashboardId;
        const tilesIdArray = req.body.tiles.map((tile) => {
          return new mongoose.Types.ObjectId(tile._id);
        });

        tilesIdArray.forEach(async (id) => {
          const updateTile = await Tile.findOneAndUpdate(
            { _id: id },
            { $set: { isInsidePod: true } },
            { new: true },
          );
        });

        const data = {
          x: req.body.x,
          y: req.body.y,
          height: req.body.height,
          width: req.body.width,
          isPod: req.body.isPod,
          tiles: tilesIdArray,
        };
        const pod = await Pod.create(data);

        var dashboard = await Dashboard.findOne({ _id: boardId });
        dashboard = dashboard.toObject();

        dashboard.pods = [...dashboard.pods, pod._id];

        const updatedDashBoard = await Dashboard.updateOne(
          { _id: boardId },
          {
            $set: { pods: dashboard.pods },
          },
        );
        if (updatedDashBoard) {
          res.status(200).json(pod);
        } else res.status(400).json("Error At creating pod");
        break;

      default:
        break;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ Message: "server Error" });
  }
};
export default createPod;
