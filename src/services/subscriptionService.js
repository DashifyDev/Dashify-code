import "@/utils/db";
import User from "@/models/user";
import stripe from "@/utils/stripe";
import { PLANS, STRIPE_PRICES } from "@/constants/plans";

function priceIdToPlan(priceId) {
  if (priceId === STRIPE_PRICES.annual) return PLANS.pro_annual;
  if (priceId === STRIPE_PRICES.monthly) return PLANS.pro_monthly;
  console.warn("priceIdToPlan: unknown priceId", priceId, "— defaulting to pro_monthly");
  return PLANS.pro_monthly;
}

/**
 * Returns { plan, status, isPro } for the given user.
 * Single DB query — never calls Stripe API at runtime.
 */
export async function getUserPlan(userId) {
  const user = await User.findById(userId).select(
    "subscriptionStatus subscriptionCurrentPeriodEnd plan"
  );
  if (!user) return { plan: PLANS.free, status: "", isPro: false };

  const { subscriptionStatus: status, subscriptionCurrentPeriodEnd, plan } = user;
  const isPro =
    status === "active" ||
    status === "trialing" ||
    (status === "canceled" &&
      subscriptionCurrentPeriodEnd &&
      new Date(subscriptionCurrentPeriodEnd) > new Date());

  return { plan: plan || PLANS.free, status: status || "", isPro };
}

/** Creates a Stripe Checkout Session and returns it. */
export async function createCheckoutSession({ priceId, userEmail, userId, successUrl, cancelUrl }) {
  const params = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };
  if (userEmail) params.customer_email = userEmail;
  if (userId) params.metadata = { user_id: String(userId) };

  return stripe.checkout.sessions.create(params);
}

/** Creates a Stripe Customer Portal Session and returns it. */
export async function createPortalSession({ stripeCustomerId, returnUrl }) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
}

/** Handles checkout.session.completed — activates subscription on User. */
export async function activateSubscription(session) {
  const userId = session.metadata?.user_id;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0]?.price?.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await User.findByIdAndUpdate(userId, {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: currentPeriodEnd,
    plan: priceIdToPlan(priceId),
  });
}

/** Handles customer.subscription.updated */
export async function updateSubscription(subscription) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (!user) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await User.findByIdAndUpdate(user._id, {
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: currentPeriodEnd,
    plan: priceIdToPlan(priceId),
  });
}

/** Handles customer.subscription.deleted */
export async function cancelSubscription(subscription) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (!user) return;

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : user.subscriptionCurrentPeriodEnd;

  await User.findByIdAndUpdate(user._id, {
    subscriptionStatus: "canceled",
    subscriptionCurrentPeriodEnd: currentPeriodEnd,
    stripeSubscriptionId: null,
    // plan stays as-is — isUserPro() governs access via the date check
  });
}

/** Handles invoice.payment_succeeded */
export async function handlePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;
  const user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
  if (!user) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await User.findByIdAndUpdate(user._id, {
    subscriptionCurrentPeriodEnd: currentPeriodEnd,
    subscriptionStatus: "active",
  });
}

/** Handles invoice.payment_failed */
export async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
  if (!user) return;

  await User.findByIdAndUpdate(user._id, { subscriptionStatus: "past_due" });
}
