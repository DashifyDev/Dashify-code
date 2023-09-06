import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";

const defaultDashboard= async(req,res)=>{
    try {
        await connectMongo()
        switch (req.method) {
            case 'GET':
                let adminBoards= await Dashboard.find({hasAdminAdded:true}).populate("tiles")
                if(adminBoards){
                    res.status(200).send(adminBoards)
                }else{
                    res.status(400).send("No Admin Board Found")
                }
        }
        
    } catch (error) {
        console.log("Error:",error.message);
    }
    
}
export default defaultDashboard;