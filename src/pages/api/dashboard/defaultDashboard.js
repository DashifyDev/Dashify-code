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
          .sort({ createdAt: -1 });

        let adminBoards = allAdminBoards.filter((board) => {
          const userIdMatch =
            board.userId?.toString() === adminUser._id.toString() ||
            (board.userId?._id && board.userId._id.toString() === adminUser._id.toString());
          const hasAdminFlag = board.hasAdminAdded === true;
          return userIdMatch && hasAdminFlag;
        });

        if (allAdminBoards.length > adminBoards.length) {
          adminBoards = allAdminBoards.filter((board) => {
            const userIdMatch =
              board.userId?.toString() === adminUser._id.toString() ||
              (board.userId?._id && board.userId._id.toString() === adminUser._id.toString());
            return userIdMatch;
          });
        }

        if (adminBoards && adminBoards.length > 0) {
          const newestAdminBoard = adminBoards[0];
          const adminBoardId = newestAdminBoard._id.toString();

          const nonAdminBoards = allAdminBoards.filter((board) => {
            const userIdMatch =
              board.userId?.toString() === adminUser._id.toString() ||
              (board.userId?._id && board.userId._id.toString() === adminUser._id.toString());
            const hasAdminFlag = board.hasAdminAdded === true;
            const boardId = board._id.toString();
            const isNotAdminBoard = boardId !== adminBoardId;
            return userIdMatch && !hasAdminFlag && isNotAdminBoard;
          });

          const selectedNonAdminBoards = nonAdminBoards.slice(0, 10);

          const result = [newestAdminBoard, ...selectedNonAdminBoards];
          res.status(200).send(result);
        } else {
          res.status(400).send("No Admin Board Found");
        }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
};
export default defaultDashboard;
