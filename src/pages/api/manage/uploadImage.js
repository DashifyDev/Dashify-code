import IncomingForm from "formidable-serverless";
import imageUpload from "@/utils/imageUpload";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadImage = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });
  try {
    const form = new IncomingForm();
    await form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Upload parse error" });
      }
      if (!files || !files.tileImage) {
        return res.status(400).json({ message: "No file" });
      }
      const url = await imageUpload(files);
      return res.status(200).json({ url });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

export default uploadImage;
