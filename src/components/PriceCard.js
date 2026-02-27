"use client";

import { Button } from "@/components/ui/button";

/**
 * Reusable subscription price card.
 * Props:
 *   name: string — Plan name (e.g. "Free", "Pro")
 *   priceDisplay: string — Price string (e.g. "$0", "$2.99/mo")
 *   priceSubline: string | null — Line under price (e.g. "Billed annually") or null for placeholder
 *   features: Array<{ text: string, included: boolean }>
 *   badge: string | null — Optional badge text (e.g. "Most Popular")
 *   highlighted: boolean — Use brand border and accent
 *   buttonLabel: string
 *   onButtonClick: () => void | undefined — Omit for disabled/static CTA
 *   buttonDisabled: boolean
 *   checkoutError: string | null — Optional error message above button (e.g. for Pro)
 */
export default function PriceCard({
  name,
  priceDisplay,
  priceSubline,
  features,
  badge,
  highlighted,
  buttonLabel,
  onButtonClick,
  buttonDisabled = false,
  checkoutError = null,
}) {
  const borderClass = highlighted
    ? "border-2 border-[#63899e]"
    : "border border-gray-200/60";
  const badgeClass = "absolute -top-3 left-1/2 -translate-x-1/2 bg-[#63899e] text-white text-xs px-3 py-1 rounded-full font-medium";

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl shadow-sm p-8 relative ${borderClass}`}
    >
      {badge && <span className={badgeClass}>{badge}</span>}
      <div className="min-h-[7rem]">
        <h2 className="text-xl font-semibold mb-1">{name}</h2>
        <p className="text-3xl font-bold mb-1">{priceDisplay}</p>
        <p
          className={
            priceSubline
              ? "text-sm text-green-600"
              : "text-sm text-transparent select-none"
          }
          aria-hidden={!priceSubline}
        >
          {priceSubline || "Placeholder"}
        </p>
      </div>
      <ul className="space-y-2 text-gray-600 mb-6 text-sm flex-1">
        {features.map(({ text, included }, i) => (
          <li
            key={i}
            className={included ? "" : "text-gray-400"}
          >
            {included ? "✓" : "✗"} {text}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        {checkoutError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm text-center">
            {checkoutError}
          </div>
        )}
        <Button
          variant={highlighted ? "default" : "outline"}
          className={`w-full ${highlighted ? "bg-[#63899e] hover:bg-[#4a6d7e]" : ""}`}
          disabled={buttonDisabled}
          onClick={onButtonClick}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
