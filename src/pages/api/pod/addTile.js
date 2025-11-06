import connectMongo from "@/utils/db";
import Tile from "@/models/tile";
import Pod from "@/models/pod";

const addTileToPod = async (req, res) => {
  try {
    await connectMongo();
    const { tileId, podId } = req.body;
    let isAdd = req.body.isAdd;
    if (isAdd) {
      const updatedPod = await Pod.findOneAndUpdate(
        { _id: podId },
        { $push: { tiles: tileId } },
      );
      if (updatedPod) {
        const update = await Tile.updateOne(
          { _id: tileId },
          { $set: { isInsidePod: true } },
        );
        if (update) {
          res.status(200).json({ message: "add Tile Succesfully" });
        }
      }
    } else {
      const updatedPod = await Pod.findOneAndUpdate(
        { _id: podId },
        { $pull: { tiles: tileId } },
      );
      if (updatedPod) {
        const update = await Tile.updateOne(
          { _id: tileId },
          { $set: { isInsidePod: false } },
        );
        if (update) {
          res.status(200).json({ message: "remove Tile successfully" });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default addTileToPod;
