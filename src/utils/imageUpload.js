import fs from "fs-extra";
import { v2 as cloudinary } from "cloudinary";

const imageUpload = async (files) => {
  let path = files.tileImage["path"];

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_API_KEY,
    api_secret: process.env.NEXT_PUBLIC_CLOUD_API_SECRET,
  });

  const cloudinaryResponse = await cloudinary.uploader.upload(path);
  return cloudinaryResponse.secure_url;
};

export default imageUpload;
