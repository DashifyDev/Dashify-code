"use client";

import { Button } from "../ui/button";

function ShareLinkModal({ open, url, isCopied, onCopy, onClose }) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Share Dashboard</h2>
          </div>
          <div className="px-6 py-4">
            <input
              type="text"
              value={url}
              readOnly
              className="w-full px-3 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#63899e]/20 select-all"
              onClick={e => e.target.select()}
            />
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="w-1/2">
                Cancel
              </Button>
              {isCopied ? (
                <Button variant="default" disabled className="w-1/2">
                  Copied
                </Button>
              ) : (
                <Button variant="default" onClick={() => onCopy()} className="w-1/2">
                  Copy
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ShareLinkModal;
