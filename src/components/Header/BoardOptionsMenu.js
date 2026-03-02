"use client";

export default function BoardOptionsMenu({
  anchor,
  isMobile,
  dbUser,
  onClose,
  onShare,
  onRename,
  onDuplicate,
  onDelete,
}) {
  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();

  // Mobile: narrower menu left-aligned to button; desktop: wider menu right-aligned to button
  const menuWidth = isMobile ? 176 : 192;
  const menuLeft = isMobile ? rect.left : rect.right - menuWidth;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`fixed z-50 mt-1 bg-white rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm ${isMobile ? "w-44" : "w-48"}`}
        style={{
          top: rect.bottom + 4,
          left: menuLeft,
        }}
      >
        <div>
          {(dbUser || !isMobile) && (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onShare();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </a>
          )}
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              onRename();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Rename</span>
          </a>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              onDuplicate();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Duplicate</span>
          </a>
        </div>
        <div className="border-b border-gray-100"></div>
        <div>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              onDelete();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100 no-underline"
          >
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete</span>
          </a>
        </div>
      </div>
    </>
  );
}
