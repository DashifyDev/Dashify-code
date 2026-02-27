"use client";
import SubscriptionStatusBadge from "@/components/SubscriptionStatusBadge";
import { globalContext } from "@/context/globalContext";
import {
  FREE_PLAN_MAX_BOARDS,
  FREE_PLAN_MAX_TILES_PER_BOARD,
  isUserPro,
  PLAN_LABELS,
  PLANS,
} from "@/constants/plans";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

export default function AccountPage() {
  const { user } = useUser();
  const { dbUser, boards } = useContext(globalContext);
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const isPro = isUserPro(dbUser);

  const planKey = dbUser?.plan || PLANS.free;
  const planLabel = PLAN_LABELS[planKey] ?? "Free";

  const periodEnd = dbUser?.subscriptionCurrentPeriodEnd
    ? new Date(dbUser.subscriptionCurrentPeriodEnd).toLocaleDateString()
    : null;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await axios.post("/api/stripe/create-portal-session");
      window.location.href = res.data.url;
    } catch (err) {
      setPortalError(err.response?.data?.message || "Failed to open billing portal.");
      setPortalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view your account.</p>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-3xl font-bold text-[#63899e]">Account</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Profile</h2>
        <div className="flex items-center gap-4">
          {user.picture && (
            <Image
              src={user.picture}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Subscription</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Plan:</span>
            <span className="font-medium text-gray-900">{planLabel}</span>
            {dbUser && dbUser.subscriptionStatus && (isPro || dbUser.subscriptionStatus === 'past_due') && (
              <SubscriptionStatusBadge status={dbUser.subscriptionStatus} />
            )}
          </div>
          {periodEnd && (
            <p className="text-sm text-gray-500">
              {dbUser?.subscriptionStatus === "canceled"
                ? `Access until: ${periodEnd}`
                : `Renews: ${periodEnd}`}
            </p>
          )}
        </div>
        <div className="pt-2">
          {isPro ? (
            <div className="space-y-2">
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="px-4 py-2 bg-[#63899e] text-white text-sm rounded-lg disabled:opacity-50"
              >
                {portalLoading ? "Opening\u2026" : "Manage Subscription"}
              </button>
              {portalError && <p className="text-sm text-red-600">{portalError}</p>}
            </div>
          ) : (
            <button
              onClick={() => router.push("/subscription")}
              className="px-4 py-2 bg-[#63899e] text-white text-sm rounded-lg"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </section>

      {/* Usage */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Usage</h2>
        {!isPro ? (
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              Boards:{" "}
              <span className="font-medium">{boards.length}</span> / {FREE_PLAN_MAX_BOARDS}
            </p>
            <p>
              Tiles per board: up to{" "}
              <span className="font-medium">{FREE_PLAN_MAX_TILES_PER_BOARD}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Unlimited boards and tiles on Pro.</p>
        )}
      </section>
    </div>
  );
}
