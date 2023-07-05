import Pod from "@/models/pod";
import Tile from "@/models/tile";
import Dashboard from "@/models/dashboard";
import connectMongo from "@/utils/db";

const podData = async(req,res) => {
    try{
        await connectMongo()
        const {id} = req.query
         
        switch (req.method) {
            case 'PATCH':
                const updatedData = req.body
                const updated = await Pod.findByIdAndUpdate( 
                    { _id : id },
                    {$set: updatedData},
                    { new: true }  )
                if(updated){
                    res.status(200).json(updated)
                }
                else{
                    res.status(200).json({message : 'Error At update'})
                }
                
                break;
            
            case 'DELETE':
                const deletedPod = await Pod.findByIdAndDelete({_id:id})
                let remainTile = deletedPod.tiles
                remainTile.forEach (async (id) => {
                    const updateTile = await Tile.findOneAndUpdate( 
                        { _id : id},
                        {$set: {isInsidePod : false}},
                        { new: true }  )
                }); 
                if(deletedPod){
                    const deletefromBoard = await Dashboard.findOneAndUpdate(
                        { pods: { $in: [id] } },
                        { $pull: { pods: id} },
                        { new : true}
                        )
                    res.status(200).json({message:'delete Sucess'})
                }
                else{
                    res.status(200).json({message : 'Error At delete'})
                }
                break;        
            default:
                break;
        }

    }
    catch(err){
        console.log(err)
        res.status(500).json({message : 'Server Error'})
    }    
}

export default podData