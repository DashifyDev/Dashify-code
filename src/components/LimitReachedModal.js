"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Modal shown when a Free user hits the board or tile limit.
 * Rendered via portal so it appears above header and is properly centered.
 * Props:
 *   type: "board" | "tile"
 *   limit: number (from constants)
 *   open: boolean
 *   onClose: () => void
 */
export default function LimitReachedModal({ type, limit, open, onClose }) {
  const router = useRouter();

  if (!open) return null;

  const noun = type === "board" ? "boards" : "tiles per board";

  const handleUpgrade = () => {
    onClose();
    router.push("/subscription");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-reached-title"
    >
      <div
        className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl relative z-[10001]"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="limit-reached-title" className="text-lg font-semibold mb-2">
          Limit Reached
        </h3>
        <p className="text-gray-600 mb-6">
          Free accounts can only have {limit} {noun}. Delete one or upgrade for unlimited.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleUpgrade}>View Plans</Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}
