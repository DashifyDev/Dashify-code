import "@/utils/db";
import { createPortalSession } from "@/services/subscriptionService";
import { getSession } from "@auth0/nextjs-auth0";
import User from "@/models/user";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await User.findOne({ email: session.user.email }).select("stripeCustomerId");
    if (!dbUser?.stripeCustomerId) {
      return res.status(400).json({ message: "No subscription found" });
    }

    const baseUrl = process.env.AUTH0_BASE_URL || "http://localhost:3000";

    const portalSession = await createPortalSession({
      stripeCustomerId: dbUser.stripeCustomerId,
      returnUrl: `${baseUrl}/subscription`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error("create-portal-session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default handler;
