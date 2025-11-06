import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";

const defaultDashboard = async (req, res) => {
  try {
    await connectMongo();

    switch (req.method) {
      case "GET":
        let id = "64e552982d363680227774af";

        if (id) {
          try {
            const resolved = await User.findOne({ auth0Id: id });
            if (resolved) {
              id = resolved._id.toString();
            }
          } catch (err) {
            console.warn(
              "addDashboard GET: failed to resolve auth0 id to userId",
              err,
            );
          }
        }

        let adminBoards = await Dashboard.find({
          userId: "64e552982d363680227774af",
        }).populate("tiles");
        if (adminBoards) {
          res.status(200).send(adminBoards);
        } else {
          res.status(400).send("No Admin Board Found");
        }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
};
export default defaultDashboard;
