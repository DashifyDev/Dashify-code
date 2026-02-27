import { STRIPE_PRICES } from "@/constants/plans";
import stripe from "@/utils/stripe";

function formatAmount(unitAmountCents, currency) {
  if (unitAmountCents == null || typeof unitAmountCents !== "number") return null;
  const symbol = currency === "usd" ? "$" : currency?.toUpperCase() + " " || "";
  const value = (unitAmountCents / 100).toFixed(2);
  return `${symbol}${value}`;
}

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const monthlyPriceId = STRIPE_PRICES.monthly;
    const annualPriceId = STRIPE_PRICES.annual;
    const result = { monthly: null, annual: null };

    if (typeof monthlyPriceId === "string" && monthlyPriceId.startsWith("price_")) {
      try {
        const price = await stripe.prices.retrieve(monthlyPriceId);
        const interval = price.recurring?.interval || "month";
        const formatted = `${formatAmount(price.unit_amount, price.currency)}/${interval === "year" ? "yr" : "mo"}`;
        result.monthly = {
          formatted,
          amount: price.unit_amount,
          currency: price.currency,
          interval,
        };
      } catch (err) {
        console.warn("Stripe prices API: failed to fetch monthly price", err.message);
      }
    }

    if (typeof annualPriceId === "string" && annualPriceId.startsWith("price_")) {
      try {
        const price = await stripe.prices.retrieve(annualPriceId);
        const interval = price.recurring?.interval || "year";
        const formatted =
          interval === "year"
            ? `${formatAmount(price.unit_amount, price.currency)}/yr`
            : `${formatAmount(price.unit_amount, price.currency)}/${price.recurring?.interval || "mo"}`;
        const perMonthCents = interval === "year" && price.unit_amount ? Math.round(price.unit_amount / 12) : null;
        const formattedPerMonth =
          perMonthCents != null ? `${formatAmount(perMonthCents, price.currency)}/mo` : null;
        result.annual = {
          formatted,
          formattedPerMonth,
          amount: price.unit_amount,
          currency: price.currency,
          interval,
        };
      } catch (err) {
        console.warn("Stripe prices API: failed to fetch annual price", err.message);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("stripe/prices:", error);
    return res.status(500).json({ message: "Failed to load prices" });
  }
};

export default handler;
