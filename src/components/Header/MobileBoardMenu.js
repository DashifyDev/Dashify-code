"use client";
import { ReactSortable } from "react-sortablejs";

export default function MobileBoardMenu({
  anchor,
  boards,
  activeBoard,
  onSelectBoard,
  onAddBoard,
  onShowOptions,
  onReorder,
  onClose,
}) {
  if (!anchor) return null;

  return (
    <>
      {/* Full-screen backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm h-screen"
        onClick={onClose}
      />
      {/* Panel positioned below the anchor */}
      <div
        className="fixed z-50 w-[280px] max-h-[60vh] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col"
        style={{
          top: anchor.getBoundingClientRect().bottom + 4,
          left: anchor.getBoundingClientRect().left,
        }}
      >
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <ReactSortable
            list={boards}
            setList={onReorder}
            animation={200}
            easing="ease-out"
            handle=".board-drag-handle"
            filter=".board-options-btn"
            preventOnFilter={false}
            className="flex flex-col"
            key={(boards || []).map(b => String(b._id)).join(",")}
          >
            {boards.map((board, index) => (
              <div
                key={board._id}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                  board._id === activeBoard
                    ? "bg-[#63899e]/15 font-semibold text-[#538a95]"
                    : "text-[#538a95] hover:bg-[#63899e]/10"
                }`}
                onClick={() => onSelectBoard(board._id)}
              >
                <svg
                  className="board-drag-handle w-5 h-5 mr-2 text-[#538a95]/60 flex-shrink-0 cursor-move"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
                <span className="truncate flex-1">{board.name}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onShowOptions(board, index, e.currentTarget);
                  }}
                  className="board-options-btn ml-2 p-1 rounded hover:bg-[#63899e]/20 text-[#538a95] border-0 outline-none cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </ReactSortable>
          <div className="border-t border-[#63899e]/30 mt-2 pt-2">
            <button
              onClick={onAddBoard}
              className="w-full flex items-center gap-2 px-4 py-3 bg-[#63899e]/10 hover:bg-[#63899e]/20 text-[#538a95] font-semibold transition-colors border-0 outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
