import connectMongo from "./db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import User from "@/models/user";

export const createDatabaseIndexes = async () => {
  try {
    await connectMongo();

    console.log("Creating database indexes for performance optimization...");

    await Dashboard.collection.createIndex({ userId: 1 });
    await Dashboard.collection.createIndex({ sessionId: 1 });
    await Dashboard.collection.createIndex({ position: 1 });
    await Dashboard.collection.createIndex({ hasAdminAdded: 1 });
    await Dashboard.collection.createIndex({ createdAt: -1 });

    await Dashboard.collection.createIndex({ userId: 1, position: 1 });

    await Dashboard.collection.createIndex({ sessionId: 1, createdAt: 1 });

    await Tile.collection.createIndex({ isInsidePod: 1 });
    await Tile.collection.createIndex({ x: 1, y: 1 }); 

    await Pod.collection.createIndex({ isPod: 1 });
    await Pod.collection.createIndex({ x: 1, y: 1 }); 

    await User.collection.createIndex({ email: 1 }, { unique: true });

    console.log("Database indexes created successfully!");
  } catch (error) {
    console.error("Error creating database indexes:", error);
    throw error;
  }
};

export const getDashboardMinimal = async (id) => {
  try {
    await connectMongo();

    const dashboard = await Dashboard.findOne(
      { _id: id },
      {
        name: 1,
        tiles: 1,
        pods: 1,
        userId: 1,
        sessionId: 1,
        createdAt: 1,
        position: 1,
      }
    ).lean(); 

    if (!dashboard) {
      return null;
    }

    const tiles = await Tile.find(
      { _id: { $in: dashboard.tiles }, isInsidePod: false },
      {
        _id: 1,
        tileText: 1,
        tileContent: 1,
        tileBackground: 1,
        action: 1,
        width: 1,
        height: 1,
        x: 1,
        y: 1,
        displayTitle: 1,
        titleX: 1,
        titleY: 1,
        editorHeading: 1,
        backgroundAction: 1,
      }
    ).lean();

    const pods = await Pod.find(
      { _id: { $in: dashboard.pods } },
      {
        _id: 1,
        width: 1,
        height: 1,
        x: 1,
        y: 1,
        tiles: 1,
      }
    ).lean();

    if (pods.length > 0) {
      const podTileIds = pods.flatMap((pod) => pod.tiles);
      const podTiles = await Tile.find(
        { _id: { $in: podTileIds } },
        {
          _id: 1,
          tileText: 1,
          tileContent: 1,
          tileBackground: 1,
          action: 1,
          width: 1,
          height: 1,
          x: 1,
          y: 1,
          displayTitle: 1,
          titleX: 1,
          titleY: 1,
          editorHeading: 1,
          backgroundAction: 1,
        }
      ).lean();

      pods.forEach((pod) => {
        pod.tiles = podTiles.filter((tile) => pod.tiles.includes(tile._id));
      });
    }

    return {
      ...dashboard,
      tiles,
      pods,
    };
  } catch (error) {
    console.error("Error fetching dashboard minimal:", error);
    throw error;
  }
};

export const getUserDashboards = async (userId, sessionId) => {
  try {
    await connectMongo();

    const query = userId ? { userId } : { sessionId };
    const sort = userId ? { position: 1 } : { createdAt: 1 };

    const dashboards = await Dashboard.find(query, {
      _id: 1,
      name: 1,
      tiles: 1,
      pods: 1,
      userId: 1,
      sessionId: 1,
      createdAt: 1,
      position: 1,
      default: 1,
      hasAdminAdded: 1,
    })
      .sort(sort)
      .lean();

    return dashboards;
  } catch (error) {
    console.error("Error fetching user dashboards:", error);
    throw error;
  }
};
