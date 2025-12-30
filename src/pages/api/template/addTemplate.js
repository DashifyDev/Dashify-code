import Template from "@/models/template";
import "@/utils/db"; // Initialize MongoDB connection
import imageUpload from "@/utils/imageUpload";
import IncomingForm from "formidable-serverless";

export const config = {
  api: {
    bodyParser: false,
  },
};

const addTemplate = async (req, res) => {
  try {

    switch (req.method) {
      case "POST":
        let form = new IncomingForm();
        let newData;
        await form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.status(500).send("An error occurred");
          }
          if (fields.formValue) {
            newData = JSON.parse(fields.formValue);
          } else {
            newData = fields;
          }
          if (files && files.tileImage) {
            let tileImage = await imageUpload(files);
            newData.boardImage = tileImage;
          }
          const board = await Template.create(newData);
          if (board) {
            res.status(200).json(board);
          } else {
            res.status(400).json({ message: "Error while updating" });
          }
        });
        break;

      case "GET":
        let filter = req.query.filter;
        let getData;
        if (filter === "mostPopular") {
          getData = await Template.find().sort({ rating: -1 }).exec();
        } else if (filter === "newest") {
          getData = await Template.find().sort({ date: -1 }).exec();
        } else if (filter === "aToz") {
          getData = await Template.find().sort({ boardName: 1 }).exec();
        } else {
          getData = await Template.find();
        }
        if (getData) {
          res.status(200).json(getData);
        } else {
          res.status(400).send("Data not found");
        }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
export default addTemplate;
