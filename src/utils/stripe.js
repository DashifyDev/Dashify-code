import Stripe from "stripe";

const isTestMode = process.env.STRIPE_TEST_MODE === "true";
const secretKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;

let stripe = null;
if (secretKey) {
  stripe = new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
} else if (process.env.NODE_ENV === "development") {
  const keyName = isTestMode ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_SECRET_KEY";
  console.warn(`stripe.js: ${keyName} is not configured. Stripe actions are disabled.`);
}

export default stripe;
