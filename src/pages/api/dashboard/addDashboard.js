import connectMongo from "@/utils/db";
import Dashboard from "@/models/dashboard";
import { getUserDashboards } from "@/utils/databaseIndexes";

const addDashBoard = async (req, res) => {
  try {
    await connectMongo();
    console.log("database Connected Successfully", req.method);
    switch (req.method) {
      case "POST":
        const data = req.body;
        const dashboard = await Dashboard.create(data);
        res.status(200).json(dashboard);

        break;

      case "GET":
        let id = req.query.id;
        let sid = req.query.sid;

        const boards = await getUserDashboards(id, sid);

        if (boards && boards.length > 0) {
          res.setHeader(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=900, max-age=120"
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
            { position: item.position }
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
