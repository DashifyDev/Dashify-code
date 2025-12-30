import Dashboard from "@/models/dashboard";
import User from "@/models/user";
import "@/utils/db"; // Initialize MongoDB connection
import Tile from "@/models/tile";
import Pod from "@/models/pod";

const manageSession = async (req, res) => {
  try {
    const id = req.body.userId;
    const sid = req.body.sid;
    let oldUser = await Dashboard.find({ userId: id });
    if (oldUser.length >= 1) {
      let totalTiles = [];
      let totalPods = [];
      let dashBoardIds = [];
      let dashboards = await Dashboard.find({ sessionId: sid });

      dashboards.forEach((board) => {
        dashBoardIds = [...dashBoardIds, board._id];
        totalTiles = [...totalTiles, ...board.tiles];
        totalPods = [...totalPods, ...board.pods];
      });

      let tile = await Tile.deleteMany({ _id: { $in: totalTiles } });
      let pod = await Pod.deleteMany({ _id: { $in: totalPods } });
      let boards = await Dashboard.deleteMany({ _id: { $in: dashBoardIds } });

      if (tile || pod || boards) {
        res.status(200).json({ messgae: "update old user" });
      }
    } else {
      let data = await Dashboard.updateMany(
        { sessionId: sid },
        { $set: { userId: id } },
      );
      if (data) {
        res.status(200).json({ messgae: "update new user" });
      }
    }
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};
export default manageSession;
