import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import User from "@/models/user";

const defaultDashboard = async (req, res) => {
  try {
    await connectMongo();
    switch (req.method) {
      case "GET":
        const adminUser = await User.findOne({ email: "contact@boardzy.app" });
        if (!adminUser) {
          return res.status(400).send("Admin user not found");
        }

        let adminBoards = await Dashboard.find({
          hasAdminAdded: true,
          userId: adminUser._id,
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
