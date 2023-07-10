import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";


const addDashBoard = async (req, res) => {
    try {
        await connectMongo();
        console.log("database Connected Successfully",req.method)
        switch (req.method) {
            case 'POST':
                const data = req.body
                const dashboard = await Dashboard.create(data);
                res.status(200).json(dashboard);
                
                break;

            case 'GET':
                let id = req.query.id 
                let sid = req.query.sid
                let boards
                if(id){
                    boards = await Dashboard.find({userId : id}).sort({'createdAt': 1})
                }
                else{
                    boards = await Dashboard.find({sessionId : sid}).sort({'createdAt': 1})
                } 
                 
                if(boards){
                    res.status(200).json(boards);
                }
                else{
                    res.status(400).json({message : 'empaty Boards Found'});
                }
                break;
            default:
                break;
        }
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
}


export default addDashBoard