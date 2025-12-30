import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import "@/utils/db"; // Initialize MongoDB connection

const clearSession = async (req, res) => {
  try {
    let sid = req.query.sid;
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
      res.status(200).json({ message: "Remove Success" });
    } else {
      res.status(400).json({ message: "Error at remove" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

export default clearSession;
