import Dashboard from "@/models/dashboard";
import User from "@/models/user";
import connectMongo from "@/utils/db";
import Tile from "@/models/tile";
import Pod from "@/models/pod";

const addGuestData = async(req,res) => {
    try {
        connectMongo()
        const id = req.body.userId
        const localData = req.body.localData
        let oldUser = await Dashboard.find({ userId: id })
        if (oldUser.length >= 1) {
            res.status(200).json({ message: 'user alredy Exists' })
        }
        else {
            localData.forEach(async (dashboardObj) => {
                try {

                    let tiles = dashboardObj.tiles
                    let insert = await Tile.insertMany(tiles,{ rawResult: true })
                    let tileIds = Object.values(insert.insertedIds)
                    const dashboard = new Dashboard({
                        userId : id,
                        name: dashboardObj.name,
                        tiles: tileIds,
                        default: dashboardObj.default
                    });
                    await dashboard.save();

                } catch (error) {
                    console.error('Error inserting data:', error);
                }
            })
            return res.status(200).json({ message: 'saved User Data' })
        }

    }catch(err){
        console.log(err)
        res.status(500).json({message : 'server error'})
    } 
    
}
export default addGuestData