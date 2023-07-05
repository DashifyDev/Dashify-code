import connectMongo from "@/utils/db";
import User from "@/models/user";

const getUser = async(req,res) => {
    try {
        await connectMongo();
        console.log("database Connected Successfully")

        const { email } = req.body;

        let user = await User.findOne({ email });
        if (!user){
           res.status(400).json({message : 'User Not Found'})
        }
        if (user) {
            res.status(201).json(user)
        }


    } catch (err) {
        console.error(err);
        res.status(500).json({message : 'User Not Found'});
    }

}

export default getUser