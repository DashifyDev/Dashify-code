import Dashboard from "@/models/dashboard";
import connectMongo from "@/utils/db";
import Tile from "@/models/tile";

const assignDatatoNewUser = async (req, res) => {
  try {
    connectMongo();
    const id = req.query.id;
    const data = req.body;
    let tiles = data.tiles;

    tiles = tiles.map((tile) => {
      const { _id, ...tileData } = tile;
      return tileData;
    });

    let insert = await Tile.insertMany(tiles, { rawResult: true });
    let tileIds = Object.values(insert.insertedIds);

    const dashboard = new Dashboard({
      userId: id,
      name: data.name,
      tiles: tileIds,
    });

    await dashboard.save();

    let allData = await dashboard.populate("tiles");

    if (allData) {
      res.status(200).json(allData);
    } else {
      res.status(400).json({ message: "Error at apdated" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};
export default assignDatatoNewUser;
