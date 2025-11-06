import React from "react";
import { FaEdit, FaUnlink, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

const LinkBubble = ({ editor }) => {
  const href = editor.getAttributes("link").href || "";
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px 10px",
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    maxWidth: "280px",
  };
  const actionsStyle = { display: "flex", gap: "8px" };
  const btnStyle = {
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333",
  };
  const linkStyle = {
    color: "#3b82f6",
    textDecoration: "underline",
    display: "inline-flex",
    gap: "6px",
    alignItems: "center",
  };

  return (
    <div style={containerStyle} onMouseDown={(e) => e.preventDefault()}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          <FaExternalLinkAlt />
          <span
            style={{
              maxWidth: 240,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {href}
          </span>
        </a>
      ) : (
        <span style={{ color: "#666" }}>No URL set</span>
      )}
      <div style={actionsStyle} className="link-bubble-actions">
        <button
          style={btnStyle}
          title="Edit link"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().extendMarkRange("link").run();
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, " ");
            const current = editor.getAttributes("link");
            const detail = {
              href: current.href || "",
              text: text || "",
              target: current.target || null,
              download: current.download || null,
            };
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("tiptap:openLinkModal", { detail }),
              );
            }
          }}
        >
          <FaEdit />
        </button>
        <button
          style={btnStyle}
          title="Unlink"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
          }}
        >
          <FaUnlink />
        </button>
        <button
          style={btnStyle}
          title="Delete"
          onClick={(e) => {
            e.preventDefault();
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .deleteSelection()
              .run();
          }}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default LinkBubble;
