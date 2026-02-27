"use client";
import PriceCard from "@/components/PriceCard";
import SubscriptionStatusBadge from "@/components/SubscriptionStatusBadge";
import { Button } from "@/components/ui/button";
import { globalContext } from "@/context/globalContext";
import { isUserPro, PLAN_LABELS, SUBSCRIPTION_PLANS } from "@/constants/plans";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useContext, useEffect, useState } from "react";

const ANNUAL_SAVINGS = "Save 20%";

function SearchParamsReader({ onParams }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onParams({ success: searchParams.get("success"), canceled: searchParams.get("canceled") });
  }, [searchParams, onParams]);
  return null;
}

export default function SubscriptionPage() {
  const { user } = useUser();
  const { dbUser } = useContext(globalContext);
  const [mounted, setMounted] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ success: null, canceled: null });
  const [prices, setPrices] = useState({ monthly: null, annual: null });
  const [checkoutError, setCheckoutError] = useState("");
  const handleParams = useCallback(p => setParams(p), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/stripe/prices")
      .then(res => (res.ok ? res.json() : {}))
      .then(data => setPrices({ monthly: data.monthly || null, annual: data.annual || null }))
      .catch(() => setPrices({ monthly: null, annual: null }));
  }, []);

  const isPro = isUserPro(dbUser);
  const monthlyDisplay = prices.monthly?.formatted ?? "—";
  const annualDisplay = prices.annual?.formattedPerMonth ?? prices.annual?.formatted ?? "—";

  const getPriceDisplayForPlan = plan => {
    if (plan.id === "free") return plan.priceDisplay;
    if (plan.id === "pro") {
      return isAnnual ? annualDisplay : monthlyDisplay;
    }
    return "—";
  };

  const getPriceSublineForPlan = plan => {
    if (plan.priceSublineKey && isAnnual && plan.id === "pro") {
      return plan.priceSublineLabel ?? null;
    }
    return null;
  };

  const handleGetStarted = async () => {
    setLoading(true);
    setCheckoutError("");
    try {
      const interval = isAnnual ? "annual" : "monthly";
      const { data } = await axios.post("/api/stripe/create-checkout-session", { interval });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("We couldn't start checkout. Please try again later.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError(
        err.response?.data?.message || "We couldn't start checkout. Please try again later."
      );
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/stripe/create-portal-session");
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Suspense fallback={null}>
        <SearchParamsReader onParams={handleParams} />
      </Suspense>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-[#63899e] mb-2">
          Subscription
        </h1>
        <p className="text-center text-gray-600 text-sm sm:text-base mb-8 sm:mb-12">
          Manage your plan
        </p>

        {params.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
            You&apos;re now on Pro! Welcome aboard.
          </div>
        )}
        {params.canceled && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-center">
            Checkout canceled. You can upgrade anytime.
          </div>
        )}

        {mounted && isPro && dbUser ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200/60 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {PLAN_LABELS[dbUser.plan] || "Pro"}
              </h2>
              <SubscriptionStatusBadge status={dbUser.subscriptionStatus} />
            </div>
            {dbUser.subscriptionCurrentPeriodEnd && (
              <p className="text-gray-500 text-sm mb-4">
                Next billing:{" "}
                {new Date(dbUser.subscriptionCurrentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {dbUser.subscriptionStatus === "past_due" && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Your last payment failed. Update your payment method to keep Pro access.
              </div>
            )}
            <Button onClick={handleManage} disabled={loading} className="w-full">
              {loading ? "Loading..." : "Manage Subscription"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex items-center gap-4 bg-white rounded-full pl-5 pr-5 py-2.5 border border-gray-200/60 shadow-sm min-w-[200px] justify-center">
                <span className={`min-w-[52px] text-center ${!isAnnual ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                  Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnnual(v => !v)}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors duration-200 ${isAnnual ? "bg-[#63899e]" : "bg-gray-300"}`}
                  aria-label={isAnnual ? "Switch to monthly" : "Switch to annual"}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm transition-[left] duration-200 ease-out ${isAnnual ? "left-[calc(100%-1.25rem)]" : "left-1"}`}
                  />
                </button>
                <span className={`min-w-[44px] text-center ${isAnnual ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                  Annual
                </span>
              </div>
              {isAnnual && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  {ANNUAL_SAVINGS}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
              {(SUBSCRIPTION_PLANS || []).map(plan => (
                <PriceCard
                  key={plan.id}
                  name={plan.name}
                  priceDisplay={getPriceDisplayForPlan(plan)}
                  priceSubline={getPriceSublineForPlan(plan)}
                  features={plan.features}
                  badge={plan.badge}
                  highlighted={plan.highlighted}
                  buttonLabel={
                    plan.ctaType === "current_plan"
                      ? mounted && user
                        ? "Current Plan"
                        : "Free Forever"
                      : loading
                        ? "Loading..."
                        : "Get Started"
                  }
                  onButtonClick={plan.ctaType === "get_started" ? handleGetStarted : undefined}
                  buttonDisabled={
                    plan.ctaType === "current_plan" ? true : loading
                  }
                  checkoutError={plan.id === "pro" ? checkoutError : null}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
