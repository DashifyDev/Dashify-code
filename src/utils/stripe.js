import Stripe from "stripe";

const isTestMode = process.env.STRIPE_TEST_MODE === "true";
const secretKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey, {
  apiVersion: "2023-10-16",
});

export default stripe;
