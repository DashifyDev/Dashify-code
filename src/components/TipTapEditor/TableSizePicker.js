"use client";

import React from "react";

const TableSizePicker = ({ maxRows = 10, maxCols = 10, onSelect }) => {
  const [hover, setHover] = React.useState({ rows: 1, cols: 1 });

  return (
    <div className="table-picker">
      <div
        className="table-grid"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 20px)` }}
      >
        {Array.from({ length: maxRows }).map((_, rIdx) =>
          Array.from({ length: maxCols }).map((__, cIdx) => {
            const r = rIdx + 1;
            const c = cIdx + 1;
            const isSelected = r <= hover.rows && c <= hover.cols;
            return (
              <div
                key={`${r}-${c}`}
                className={`table-cell${isSelected ? " selected" : ""}`}
                onMouseEnter={() => setHover({ rows: r, cols: c })}
                onClick={() => onSelect(r, c)}
              />
            );
          })
        )}
      </div>
      <div className="table-dimension">
        {hover.rows} x {hover.cols}
      </div>
    </div>
  );
};

export default TableSizePicker;
