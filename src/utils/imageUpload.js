import fs from 'fs-extra';
import { v2 as cloudinary } from 'cloudinary';

const imageUpload = async (files) => {

    let name = files.tileImage['name'];
    let path = files.tileImage['path']
    const newPath = `${process.cwd()}/public/uploads/${Date.now()}-${name}`;
    await fs.move(path, newPath);

    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.CLOUD_API_SECRET,
    });

    const cloudinaryResponse = await cloudinary.uploader.upload(newPath);
    await fs.unlink(newPath);
    return cloudinaryResponse.url

}


export default imageUpload