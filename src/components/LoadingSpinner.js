"use client";

import React, { memo } from "react";

const LoadingSpinner = memo(
  ({
    size = "medium",
    color = "#63899e",
    text = "Loading...",
    fullScreen = false,
  }) => {
    const sizeMap = {
      small: "20px",
      medium: "40px",
      large: "60px",
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;

    const containerStyle = fullScreen
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        };

    return (
      <div style={containerStyle}>
        <div
          style={{
            width: spinnerSize,
            height: spinnerSize,
            border: `4px solid #f3f3f3`,
            borderTop: `4px solid ${color}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        {text && (
          <div
            style={{
              marginTop: "16px",
              color: "#666",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {text}
          </div>
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
      </div>
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
