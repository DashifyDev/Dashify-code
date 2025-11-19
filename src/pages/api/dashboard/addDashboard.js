import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import User from "@/models/user";
import mongoose from "mongoose";
import { getUserDashboards } from "@/utils/databaseIndexes";
import { getSession } from "@auth0/nextjs-auth0";

const addDashBoard = async (req, res) => {
  try {
    await connectMongo();
    console.log("database Connected Successfully", req.method);
    switch (req.method) {
      case "POST":
        let data = req.body;

        // If client sent an auth0 id or a non-ObjectId user identifier, resolve it to Mongo _id
        if (data?.userId && !mongoose.Types.ObjectId.isValid(data.userId)) {
          try {
            const possibleUser = await User.findOne({ auth0Id: data.userId });
            if (possibleUser) {
              data.userId = possibleUser._id;
            } else {
              // leave as-is; Dashboard schema expects ObjectId, creation may fail and return an error
            }
          } catch (err) {
            console.warn(
              "addDashboard: failed to resolve userId from auth0Id",
              err,
            );
          }
        }

        // Set position for new dashboard - get the next available position
        let existingDashboards;
        if (data.userId) {
          existingDashboards = await Dashboard.find({ userId: data.userId });
        } else if (data.sessionId) {
          existingDashboards = await Dashboard.find({
            sessionId: data.sessionId,
          });
        } else {
          existingDashboards = [];
        }
        data.position = existingDashboards.length + 1;

        const dashboard = await Dashboard.create(data);
        res.status(200).json(dashboard);

        break;

      case "GET":
        let id = req.query.id;
        let sid = req.query.sid;

        // If id looks like an Auth0 id (contains '-') or isn't a valid ObjectId,
        // try to resolve to the backend User _id so we return dashboards by userId.
        if (id && !mongoose.Types.ObjectId.isValid(id)) {
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

        const session = await getSession(req, res);
        const user = session?.user;

        const roles = user?.["https://www.boardzy.app/roles"];
        const isAdmin =
          roles && Array.isArray(roles) && roles.includes("admin");

        const boards = await getUserDashboards(id, sid, isAdmin);

        if (boards && boards.length > 0) {
          res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=900, max-age=120",
          );
          res.setHeader("ETag", `"boards-${id || sid}-${Date.now()}"`);
          res.setHeader("Vary", "Accept-Encoding");

          const ifNoneMatch = req.headers["if-none-match"];
          if (ifNoneMatch === `"boards-${id || sid}-${Date.now()}"`) {
            return res.status(304).end();
          }

          res.status(200).json(boards);
        } else {
          res.status(200).json([]);
        }
        break;

      case "PATCH":
        let updatedData = req.body;
        updatedData.forEach(async (item, index) => {
          await Dashboard.updateOne(
            { _id: item._id },
            { position: item.position },
          );
        });
        return res.status(200).json({ message: "Position Updated" });
        break;

      default:
        break;
    }
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

export default addDashBoard;
