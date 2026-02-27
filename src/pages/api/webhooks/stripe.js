import "@/utils/db";
import { buffer } from "micro";
import stripe from "@/utils/stripe";
import {
  activateSubscription,
  updateSubscription,
  cancelSubscription,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from "@/services/subscriptionService";

export const config = {
  api: { bodyParser: false },
};

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const isTestMode = process.env.STRIPE_TEST_MODE === "true";
  const webhookSecret = isTestMode
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    console.error(
      "Webhook: Missing STRIPE_TEST_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SECRET) or stripe-signature header. " +
        "When using stripe listen, copy the whsec_... from the CLI output into .env."
    );
    return res.status(400).json({ message: "Webhook configuration error" });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log(`[webhook] Received ${event.type} (id: ${event.id})`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    if (isTestMode) {
      console.error(
        "Tip: When using stripe listen, you must use the whsec_... secret the CLI prints—not the Dashboard webhook secret."
      );
    }
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("[webhook] Activating subscription...");
        await activateSubscription(event.data.object);
        console.log("[webhook] Subscription activated");
        break;
      case "customer.subscription.updated":
        console.log("[webhook] Updating subscription...");
        await updateSubscription(event.data.object);
        console.log("[webhook] Subscription updated");
        break;
      case "customer.subscription.deleted":
        console.log("[webhook] Canceling subscription...");
        await cancelSubscription(event.data.object);
        console.log("[webhook] Subscription canceled");
        break;
      case "invoice.payment_succeeded":
        console.log("[webhook] Handling payment succeeded...");
        await handlePaymentSucceeded(event.data.object);
        console.log("[webhook] Payment succeeded handled");
        break;
      case "invoice.payment_failed":
        console.log("[webhook] Handling payment failed...");
        await handlePaymentFailed(event.data.object);
        console.log("[webhook] Payment failed handled");
        break;
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    // Return 200 to prevent Stripe retries for non-transient errors
  }

  console.log(`[webhook] Done: ${event.type}`);
  return res.status(200).json({ received: true });
};

export default handler;
