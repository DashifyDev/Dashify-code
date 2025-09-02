"use client";

import React, { memo, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";

const OptimizedModal = memo(
  ({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = "sm",
    fullWidth = true,
    loading = false,
    ...props
  }) => {
    useEffect(() => {
      const handleEscape = (event) => {
        if (event.key === "Escape" && open) {
          onClose();
        }
      };

      if (open) {
        document.addEventListener("keydown", handleEscape);
        
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [open, onClose]);

    const handleBackdropClick = useCallback(
      (event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      },
      [onClose]
    );

    if (!open) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        onBackdropClick={handleBackdropClick}
        {...props}
      >
        {title && (
          <div
            style={{
              padding: "16px 24px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            {title}
          </div>
        )}

        <DialogContent
          style={{
            padding: "16px 24px",
            minHeight: loading ? "100px" : "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "2px solid #f3f3f3",
                  borderTop: "2px solid #63899e",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : (
            children
          )}
        </DialogContent>

        {actions && (
          <DialogActions style={{ padding: "8px 24px 16px" }}>
            {actions}
          </DialogActions>
        )}

        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </Dialog>
    );
  }
);

OptimizedModal.displayName = "OptimizedModal";

export default OptimizedModal;
