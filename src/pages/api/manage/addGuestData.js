import Dashboard from "@/models/dashboard";
import User from "@/models/user";
import "@/utils/db"; // Initialize MongoDB connection
import Tile from "@/models/tile";
import Pod from "@/models/pod";

const addGuestData = async (req, res) => {
  try {
    const id = req.body.userId;
    const localData = req.body.localData;
    let oldUser = await Dashboard.find({ userId: id });
    if (oldUser.length >= 1) {
      res.status(200).json({ message: "user alredy Exists" });
    } else {
      localData.forEach(async (dashboardObj, index) => {
        try {
          let tiles = dashboardObj.tiles;

          tiles = tiles.map((tile) => {
            const { _id, ...tileData } = tile;
            return tileData;
          });

          let insert = await Tile.insertMany(tiles, { rawResult: true });
          let tileIds = Object.values(insert.insertedIds);
          const dashboard = new Dashboard({
            userId: id,
            name: dashboardObj.name,
            tiles: tileIds,
            default: dashboardObj.default,
            position: index + 1,
          });
          await dashboard.save();
        } catch (error) {
          console.error("Error inserting data:", error);
        }
      });
      return res.status(200).json({ message: "saved User Data" });
    }
  } catch (err) {
    console.error("Error adding guest data:", err);
    res.status(500).json({ message: "server error" });
  }
};
export default addGuestData;
