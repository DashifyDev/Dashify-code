import "@/utils/db";
import { createCheckoutSession } from "@/services/subscriptionService";
import { getSession } from "@auth0/nextjs-auth0";
import User from "@/models/user";
import { STRIPE_PRICES } from "@/constants/plans";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { interval } = req.body;
    const planKey = interval === "annual" ? "annual" : "monthly";
    const priceId = STRIPE_PRICES[planKey];

    if (!priceId || typeof priceId !== "string" || priceId.startsWith("price_PLACEHOLDER")) {
      if (process.env.NODE_ENV === "development") {
        console.warn("create-checkout-session: STRIPE price ID missing or invalid for", planKey);
      }
      return res
        .status(400)
        .json({ message: "Checkout is not configured for this plan. Please try again later." });
    }

    const userEmail = session.user.email;
    let userId;
    const dbUser = await User.findOne({ email: userEmail }).select("_id");
    if (dbUser) {
      userId = dbUser._id;
    } else {
      return res.status(404).json({ message: "User account not found" });
    }

    const baseUrl = process.env.AUTH0_BASE_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      priceId,
      userEmail,
      userId,
      successUrl: `${baseUrl}/subscription?success=true`,
      cancelUrl: `${baseUrl}/subscription?canceled=true`,
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error("create-checkout-session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default handler;
