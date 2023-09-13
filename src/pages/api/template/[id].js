import Template from "@/models/template";
import connectMongo from "@/utils/db";
import imageUpload from "@/utils/imageUpload";
import IncomingForm from "formidable-serverless";

export const config = {
  api: {
    bodyParser: false,
  },
};

const getTemplateData = async (req, res) => {
  try {
    await connectMongo();
    const { id } = req.query;
    switch (req.method) {
      case "DELETE":
        let toDeleteData = await Template.deleteOne({ _id: id });
        if (toDeleteData.acknowledged) {
          res.status(200).send(toDeleteData);
        } else {
          res.status(400).send("Not Found")
        }
        break;

      case "PATCH":
        let form = new IncomingForm();
        let newData;
        await form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.status(500).send("An error occured");
          }
          if (fields.updatedFields) {
            newData = JSON.parse(fields.updatedFields);
          } else {
            newData = fields;
          }
          if (files && files.tileImage) {
            let updateImage = await imageUpload(files);
            newData.boardImage = updateImage;
          }
          const newBoard = await Template.findByIdAndUpdate(
            { _id: id },
            { $set: newData },
            { new: true }
          );
          if (newBoard) {
            res.status(200).send(newBoard);
          } else {
            res.status(400).send({ message: "Error while updating" });
          }
        });
        break;

      default:
        break;
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

export default getTemplateData;
