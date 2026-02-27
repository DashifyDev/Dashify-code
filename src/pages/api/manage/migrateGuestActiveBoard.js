import "@/utils/db";
import { migrateActiveDashboard } from "@/services/dashboardService";
import { getSession } from "@auth0/nextjs-auth0";
import User from "@/models/user";
import Dashboard from "@/models/dashboard";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId, activeDashboard } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Verify the caller is authenticated and matches the userId
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const dbUser = await User.findOne({ email: session.user.email }).select("_id");
    if (!dbUser) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (String(dbUser._id) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await migrateActiveDashboard({ userId, activeDashboard: activeDashboard || null });

    const boards = await Dashboard.find({ userId }).sort({ position: 1 });
    return res.status(200).json({ boards, message: "Migration complete" });
  } catch (error) {
    console.error("migrateGuestActiveBoard:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default handler;
