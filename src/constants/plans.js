// Next.js loads .env automatically; no dotenv needed
export const FREE_PLAN_MAX_BOARDS = 3;
export const FREE_PLAN_MAX_TILES_PER_BOARD = 20;

const isStripeTestMode = process.env.STRIPE_TEST_MODE === "true";

export const STRIPE_PRICES = {
  monthly: isStripeTestMode
    ? process.env.STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID
    : process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  annual: isStripeTestMode
    ? process.env.STRIPE_TEST_PREMIUM_ANNUAL_PRICE_ID
    : process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
};

/** Publishable key for client-side Stripe (Elements, etc.). Use test key when test mode is active. */
export const STRIPE_PUBLISHABLE_KEY = isStripeTestMode
  ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  const [monthly, annual] = [STRIPE_PRICES.monthly, STRIPE_PRICES.annual];
  const envHint = isStripeTestMode
    ? "STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID and STRIPE_TEST_PREMIUM_ANNUAL_PRICE_ID"
    : "STRIPE_PREMIUM_MONTHLY_PRICE_ID and STRIPE_PREMIUM_ANNUAL_PRICE_ID";
  if (!monthly || !annual || !String(monthly).startsWith("price_") || !String(annual).startsWith("price_")) {
    console.warn(
      `plans.js: Stripe price IDs should be set and start with 'price_'. Check ${envHint}.`
    );
  }
}

export const PLANS = {
  free: "free",
  pro_monthly: "pro_monthly",
  pro_annual: "pro_annual",
};

/** Display label for each plan (used in UI and Pro management view). */
export const PLAN_LABELS = {
  [PLANS.free]: "Free",
  [PLANS.pro_monthly]: "Pro Monthly",
  [PLANS.pro_annual]: "Pro Annual",
};

/**
 * Subscription plan definitions for the pricing page.
 * Each entry drives one price card: name, price display key, features, badge, and CTA type.
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: PLANS.free,
    name: PLAN_LABELS[PLANS.free],
    priceDisplay: "$0",
    priceSubline: null,
    features: [
      { text: "Up to 3 boards", included: true },
      { text: "20 tiles per board", included: true },
      { text: "Community templates", included: true },
      { text: "Premium templates", included: false },
    ],
    badge: null,
    highlighted: false,
    ctaType: "current_plan",
  },
  {
    id: "pro",
    name: "Pro",
    priceDisplayKey: "monthly",
    priceSublineKey: "annual",
    priceSublineLabel: "Billed annually",
    features: [
      { text: "Unlimited boards", included: true },
      { text: "Unlimited tiles", included: true },
      { text: "All premium templates", included: true },
      { text: "Priority support", included: true },
    ],
    badge: "Most Popular",
    highlighted: true,
    ctaType: "get_started",
  },
];

export const DEFAULT_BOARD_NAMES = ["Welcome to Boardzy!", "More Boards"];

/** Returns true if dbUser object has an active Pro subscription. */
export const isUserPro = dbUser => {
  if (!dbUser) return false;
  const { subscriptionStatus, subscriptionCurrentPeriodEnd } = dbUser;
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") return true;
  if (subscriptionStatus === "canceled" && subscriptionCurrentPeriodEnd) {
    return new Date(subscriptionCurrentPeriodEnd) > new Date();
  }
  return false;
};
