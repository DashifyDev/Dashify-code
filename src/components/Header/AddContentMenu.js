"use client";

function AddContentMenu({ anchor, onClose, onAddTile, onAddBoard }) {
  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 mt-1 w-48 bg-white rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm"
        style={{
          top: rect.bottom + 4,
          left: rect.left,
        }}
      >
        <div>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              onClose();
              onAddTile();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-lg">Add Box</span>
          </a>
          <hr className="border-[#63899e]/20 m-0 p-0" />
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              onClose();
              onAddBoard();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors no-underline"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-lg">Add Board</span>
          </a>
        </div>
      </div>
    </>
  );
}

export default AddContentMenu;
