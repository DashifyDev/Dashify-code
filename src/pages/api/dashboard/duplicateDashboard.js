import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";

const duplicateDashBoard = async (req, res) => {
  await connectMongo();
  try {
    switch (req.method) {
      case "POST":
        const data = req.body;
        let tileData = await Tile.find(
          { _id: { $in: data.tiles }},
          {_id:0}
          );
        let insert = await Tile.insertMany(tileData, { rawResult: true });
        let tileIds = Object.values(insert.insertedIds);
        const duplicateBoard = new Dashboard({
          userId: data.userId,
          name: data.name,
          tiles: tileIds,
          position: data.position,
          hasAdminAdded: data.hasAdminAdded
        });
        const newBoard = await Dashboard.create(duplicateBoard);
        res.status(200).send(newBoard);
    }
  } catch (error) {
    res.status(400).send("eror", error);
  }
};
export default duplicateDashBoard;