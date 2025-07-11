import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";
import connectMongo from "@/utils/db";
import IncomingForm from "formidable-serverless";
import imageUpload from "@/utils/imageUpload";

export const config = {
  api: {
    bodyParser: false,
  },
};

const tileData = async (req, res) => {
  try {
    await connectMongo();
    const { id } = req.query;

    switch (req.method) {
      case "PATCH":
        const form = new IncomingForm();
        let updatedData;
        await form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error(err);
            return res.status(500).send("An error occurred");
          }

          if (fields.formValue) {
            updatedData = JSON.parse(fields.formValue);
          } else {
            updatedData = fields;
          }

          if (files && files.tileImage) {
            let tileImage = await imageUpload(files);
            updatedData.tileBackground = tileImage;
          }
          const updated = await Tile.findByIdAndUpdate(
            { _id: id },
            { $set: updatedData },
            { new: true }
          );
          if (updated) {
            res.status(200).json(updated);
          } else {
            res.status(400).json({ message: "Error At update" });
          }
        });

        break;

      case "DELETE":
        const isDelete = await Tile.deleteOne({ _id: id });
        if (isDelete.acknowledged) {
          const deletefromBoard = await Dashboard.findOneAndUpdate(
            { tiles: { $in: [id] } },
            { $pull: { tiles: id } },
            { new: true }
          );
          res.status(200).json(isDelete);
        } else {
          res.status(200).json({ message: "Error At delete" });
        }
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
export default tileData;
