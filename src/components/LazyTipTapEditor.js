"use client";

import React, { useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const OptimizedTipTapEditor = dynamic(
  () => import("./TipTapEditor/OptimizedTipTapEditor"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#666",
          border: "1px dashed #ccc",
          borderRadius: "4px",
        }}
      >
        Loading editor...
      </div>
    ),
  }
);

const LazyTipTapEditor = memo(
  ({
    content,
    onContentChange,
    placeholder = "Click to edit...",
    readOnly = false,
    style = {},
    className = "",
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editorContent, setEditorContent] = useState(content || "");

    const handleEditClick = useCallback(() => {
      if (!readOnly) {
        setIsEditing(true);
      }
    }, [readOnly]);

    const handleContentChange = useCallback(
      (newContent) => {
        setEditorContent(newContent);
        if (onContentChange) {
          onContentChange(newContent);
        }
      },
      [onContentChange]
    );

    const handleSave = useCallback(() => {
      setIsEditing(false);
    }, []);

    const handleCancel = useCallback(() => {
      setEditorContent(content || "");
      setIsEditing(false);
    }, [content]);

    if (isEditing) {
      return (
        <div className={`lazy-tiptap-editor ${className}`} style={style}>
          <OptimizedTipTapEditor
            initialContent={editorContent}
            onContentChange={handleContentChange}
          />
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "8px",
              justifyContent: "flex-end",
            }}
          >
            <Button size="small" onClick={handleCancel} sx={{ color: "#666" }}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: "#63899e",
                "&:hover": { backgroundColor: "#63899e", opacity: 0.8 },
              }}
            >
              Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`lazy-tiptap-content ${className}`}
        style={{
          ...style,
          position: "relative",
          minHeight: "40px",
          cursor: readOnly ? "default" : "pointer",
          border: readOnly ? "none" : "1px dashed transparent",
          borderRadius: "4px",
          padding: "8px",
          transition: "border-color 0.2s ease",
        }}
        onClick={handleEditClick}
        onMouseEnter={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = "#ccc";
          }
        }}
        onMouseLeave={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = "transparent";
          }
        }}
      >
        {editorContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: editorContent }}
            style={{
              pointerEvents: "none",
              userSelect: "text",
            }}
          />
        ) : (
          <div
            style={{
              color: "#999",
              fontStyle: "italic",
              pointerEvents: "none",
            }}
          >
            {placeholder}
          </div>
        )}

        {!readOnly && (
          <div
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              opacity: 0,
              transition: "opacity 0.2s ease",
              pointerEvents: "none",
            }}
            className="edit-button-overlay"
          >
            <EditIcon
              sx={{
                fontSize: "16px",
                color: "#666",
                backgroundColor: "white",
                borderRadius: "50%",
                padding: "2px",
              }}
            />
          </div>
        )}

        <style jsx>{`
          .lazy-tiptap-content:hover .edit-button-overlay {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    );
  }
);

LazyTipTapEditor.displayName = "LazyTipTapEditor";

export default LazyTipTapEditor;
