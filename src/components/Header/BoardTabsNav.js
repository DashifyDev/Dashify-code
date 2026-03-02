"use client";
import isDblTouchTap from "@/hooks/isDblTouchTap";
import { useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";

export default function BoardTabsNav({ boards, activeBoard, onSelectBoard, onShowOptions, onReorder }) {
  const [showIcon, setShowIcon] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [boards]);

  const scrollBoards = direction => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full overflow-visible">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBoards("left")}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e]"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Boards Scroll Container */}
      <div className="flex-1 min-w-0 relative max-w-full overflow-visible">
        <div
          ref={scrollContainerRef}
          className="flex gap-1 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth max-w-full p-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overflowY: "visible",
          }}
        >
          <ReactSortable
            filter=".dashboard_btn"
            dragClass="sortableDrag"
            list={boards}
            setList={list => onReorder(list)}
            animation={200}
            easing="ease-out"
            className="flex gap-1 items-center"
            key={(boards || []).map(b => String(b._id)).join(",")}
          >
            {boards.map((board, index) => (
              <div
                key={board._id}
                className="relative group flex items-center"
                onMouseEnter={() => setShowIcon(board._id)}
                onMouseLeave={() => setShowIcon(null)}
              >
                <button
                  onClick={() => onSelectBoard(board._id)}
                  onTouchStart={e => {
                    if (isDblTouchTap(e)) {
                      onSelectBoard(board._id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-1 ${
                    board._id === activeBoard ? "bg-[#a2c4c9] text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {board.name}
                </button>

                {showIcon === board._id && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onShowOptions(board, index, e.currentTarget);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-600 hover:text-[#63899e] transition-colors outline-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </ReactSortable>
        </div>
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={() => scrollBoards("right")}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e]"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
