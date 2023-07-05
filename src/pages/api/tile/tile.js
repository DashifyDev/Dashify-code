import connectMongo from "@/utils/db";
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";

const tile = async(req,res) => {
    try{
        await connectMongo()
        switch (req.method) {
            case 'POST':
                const boardId = req.body.dashboardId
                const data = {
                    x : req.body.x,
                    y : req.body.y,
                    height : req.body.height,
                    width : req.body.width
                }
                const tile = await Tile.create(data)
                var dashboard = await Dashboard.findOne({ _id: boardId })
                dashboard = dashboard.toObject()

                dashboard.tiles = [...dashboard.tiles, tile._id]
                const updatedDashBoard = await Dashboard.updateOne({ _id: boardId },
                    {
                        $set: { tiles: dashboard.tiles }
        
                    })
                if(updatedDashBoard){
                    res.status(200).json(tile)
                }
                else(
                    res.status(400).json('Error At add tile')
                )
                break;
        
            default:
                break;
        }

    }catch(err){
        console.log(err)
        res.status(400).json({Message : 'server Error'})
    }
}

export default tile