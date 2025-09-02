import React from "react";
import {
  FaArrowsAltH,
  FaHeading,
  FaCompressAlt,
  FaExpandAlt,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaTrash,
  FaColumns,
} from "react-icons/fa";
import { TbRowRemove, TbColumnRemove } from "react-icons/tb";

const commonStyles = {
  btn: {
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: "6px",
    width: 34,
    height: 34,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#111",
  },
  container: {
    display: "flex",
    gap: 8,
    padding: "0px 6px",
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  },
};

export const TopTableMenu = ({ editor }) => {
  if (!editor) return null;

  const isFullWidth = editor.getAttributes("table").layout === "full-width";

  const isFixedLayout = editor.getAttributes("table").layoutMode === "fixed";

  return (
    <div style={commonStyles.container} onMouseDown={(e) => e.preventDefault()}>
      <button
        style={commonStyles.btn}
        title={isFullWidth ? "Compact width" : "Full width"}
        data-tippy-content={isFullWidth ? "Compact width" : "Full width"}
        onClick={() => editor.chain().focus().toggleTableLayout().run()}
      >
        <FaArrowsAltH />
      </button>

      <button
        style={{
          ...commonStyles.btn,
          backgroundColor: isFixedLayout ? "#e0e0e0" : "transparent",
        }}
        title={
          isFixedLayout
            ? "Switch to Auto Column Width"
            : "Switch to Fixed Column Width"
        }
        data-tippy-content={isFixedLayout ? "Auto Width" : "Fixed Width"}
        onClick={() => editor.chain().focus().toggleLayoutMode().run()}
      >
        <FaColumns />
      </button>

      <button
        style={commonStyles.btn}
        title="Toggle header row"
        data-tippy-content="Toggle header row"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
      >
        <FaHeading />
      </button>
      <button
        style={commonStyles.btn}
        title="Delete table"
        data-tippy-content="Delete table"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <FaTrash />
      </button>
    </div>
  );
};

export const BottomTableMenu = ({ editor }) => {
  return (
    <div
      style={{ ...commonStyles.container, flexDirection: "column", gap: 8 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={commonStyles.btn}
          title="Add row above"
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <FaArrowUp />
        </button>
        <button
          style={commonStyles.btn}
          title="Add row below"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <FaArrowDown />
        </button>
        <button
          style={commonStyles.btn}
          title="Delete current row"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <TbRowRemove />
        </button>
        <button
          style={commonStyles.btn}
          title="Merge/Split cells"
          onClick={() => editor.chain().focus().mergeOrSplit().run()}
        >
          <FaCompressAlt />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={commonStyles.btn}
          title="Add column left"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <FaArrowLeft />
        </button>
        <button
          style={commonStyles.btn}
          title="Add column right"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <FaArrowRight />
        </button>
        <button
          style={commonStyles.btn}
          title="Delete current column"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <TbColumnRemove />
        </button>
        <button
          style={commonStyles.btn}
          title="Split cell"
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          <FaExpandAlt />
        </button>
      </div>
    </div>
  );
};
