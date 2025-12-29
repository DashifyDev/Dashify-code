import connectMongo from "./db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import User from "@/models/user";
import mongoose from "mongoose";

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

    // Validate ObjectId to avoid CastError when non-ObjectId (e.g. UUID) is passed
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

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
      },
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
        tileLink: 1,
        order: 1,
        mobileX: 1,
        mobileY: 1,
        mobileWidth: 1,
        mobileHeight: 1,
      },
    )
      .sort({ order: 1, mobileY: 1 }) // Sort by order first, then by mobileY as fallback
      .lean();

    const pods = await Pod.find(
      { _id: { $in: dashboard.pods } },
      {
        _id: 1,
        width: 1,
        height: 1,
        x: 1,
        y: 1,
        tiles: 1,
      },
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
          tileLink: 1,
        },
      ).lean();

      pods.forEach((pod) => {
        pod.tiles = podTiles.filter((tile) => pod.tiles.includes(tile._id));
      });
    }

    // Ensure tiles are sorted by order (for mobile view)
    // Tiles with order > 0 should be sorted by order, others by mobileY
    const sortedTiles = [...tiles].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      
      // If both have order, sort by order
      if (orderA > 0 && orderB > 0) {
        return orderA - orderB;
      }
      // If only one has order, prioritize it
      if (orderA > 0) return -1;
      if (orderB > 0) return 1;
      // If neither has order, sort by mobileY
      const yA = a.mobileY ?? 0;
      const yB = b.mobileY ?? 0;
      return yA - yB;
    });

    return {
      ...dashboard,
      tiles: sortedTiles,
      pods,
    };
  } catch (error) {
    console.error("Error fetching dashboard minimal:", error);
    throw error;
  }
};

export const getUserDashboards = async (userId, sessionId, isAdmin = false) => {
  try {
    await connectMongo();

    // For Auth0 users, use sessionId instead of userId to avoid ObjectId casting issues
    const query = sessionId ? { sessionId } : { userId };

    // Add condition to show only user's private dashboards (not admin ones)
    if (!isAdmin) query.hasAdminAdded = { $ne: true };

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
      .sort({ createdAt: 1 }) // First sort by creation date to maintain original order
      .lean();

    // Check if any dashboards are missing position field and assign them
    const needsPositionUpdate = dashboards.some(
      (dashboard) =>
        dashboard.position === undefined || dashboard.position === null,
    );

    if (needsPositionUpdate) {
      // Update positions for dashboards that don't have them
      const updatePromises = dashboards.map((dashboard, index) => {
        if (dashboard.position === undefined || dashboard.position === null) {
          return Dashboard.updateOne(
            { _id: dashboard._id },
            { position: index + 1 },
          );
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Update the local array with new positions
      dashboards.forEach((dashboard, index) => {
        if (dashboard.position === undefined || dashboard.position === null) {
          dashboard.position = index + 1;
        }
      });
    }

    // Now sort by position
    dashboards.sort((a, b) => (a.position || 0) - (b.position || 0));

    return dashboards;
  } catch (error) {
    console.error("Error fetching user dashboards:", error);
    throw error;
  }
};
