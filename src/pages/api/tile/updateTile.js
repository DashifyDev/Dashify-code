import connectMongo from "@/utils/db";
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";
import IncomingForm from "formidable-serverless";
import imageUpload from "@/utils/imageUpload";

export const config = {
    api: {
        bodyParser: false,
    },
};

const updateTile = async (req, res) => {
    try {
        await connectMongo()

        const form = new IncomingForm();
        let updatedData
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).send('An error occurred');
            }
            updatedData = JSON.parse(fields.formValue)
            if (files && files.tileImage) {
                let tileImage = await imageUpload(files)
                updatedData.tileBackground = tileImage
                if (tileImage) {
                    return res.status(200).json(updatedData)
                }
                else {
                    return res.status(400).json({ message: 'Error at Image Upload' })
                }
            }
            else {
                return res.status(200).json(updatedData)
            }
        })


    } catch (err) {
        console.log(err)
        res.status(400).json({ Message: 'server Error' })
    }
}

export default updateTile