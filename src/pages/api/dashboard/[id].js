import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import connectMongo from "@/utils/db";

const getDashboardData = async(req,res) =>{
    try{
        await connectMongo()
        const { id } = req.query
        switch (req.method) {
            case 'GET':
                const data = await Dashboard.findOne({ _id: id }).populate(
                    {path : 'tiles', match: { isInsidePod: false }})
                    .populate({
                        path: 'pods',
                        model: 'Pod',
                        populate: {
                          path: 'tiles',
                          model: 'Tile'
                        }
                      })
               
                if (data) {
                    return res.status(200).json(data)
                }
                else {
                    res.status(400).json({ message: 'Not found' })
                }
                break;

            case 'DELETE':
                const DeletedDashboard = await Dashboard.findOneAndDelete({_id:id})
                let tilesTodelete = DeletedDashboard.tiles
                let tilesDelete = await Tile.deleteMany({ _id: { $in: tilesTodelete }})
                if(DeletedDashboard ){
                    res.status(200).json(DeletedDashboard)
                }
                else{
                    res.status(200).json({message : 'Error At delete'})
                }
                break;

                case 'PATCH':
                    const updatedData = req.body
                    const updated = await Dashboard.findByIdAndUpdate( 
                        { _id : id },
                        {$set: updatedData},
                        { new: true }  )
                    if(updated){
                        res.status(200).json(updated)
                    }
                    else{
                        res.status(200).json({message : 'Error At delete'})
                    }
                    break;
            default:
                break;
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }

}

export default getDashboardData