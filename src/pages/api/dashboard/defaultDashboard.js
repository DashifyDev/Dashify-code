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

        const allAdminBoards = await Dashboard.find({
          userId: adminUser._id,
        })
          .populate("tiles")
          .sort({ createdAt: 1 });

        let adminBoards = allAdminBoards.filter((board) => board.hasAdminAdded === true);

        if (allAdminBoards.length > adminBoards.length) {
          const missingBoards = allAdminBoards.filter((b) => b.hasAdminAdded !== true);

          adminBoards = allAdminBoards;
        }

        if (adminBoards && adminBoards.length > 0) {
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
