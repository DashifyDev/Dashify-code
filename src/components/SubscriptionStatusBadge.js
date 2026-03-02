"use client";

const STATUS_CONFIG = {
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  trialing: { label: "Trialing", className: "bg-blue-100 text-blue-800" },
  past_due: { label: "Past due", className: "bg-amber-100 text-amber-800" },
  canceled: { label: "Canceled", className: "bg-gray-100 text-gray-600" },
};

export default function SubscriptionStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.canceled;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
