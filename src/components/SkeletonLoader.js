"use client";

import React, { memo } from "react";

const SkeletonLoader = memo(
  ({ type = "tile", count = 1, className = "", style = {} }) => {
    const renderSkeleton = () => {
      switch (type) {
        case "tile":
          return (
            <div
              className={`skeleton-tile ${className}`}
              style={{
                width: "135px",
                height: "135px",
                backgroundColor: "#f0f0f0",
                borderRadius: "10px",
                animation: "pulse 1.5s ease-in-out infinite",
                ...style,
              }}
            />
          );

        case "text":
          return (
            <div
              className={`skeleton-text ${className}`}
              style={{
                height: "16px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                animation: "pulse 1.5s ease-in-out infinite",
                marginBottom: "8px",
                ...style,
              }}
            />
          );

        case "dashboard":
          return (
            <div
              className={`skeleton-dashboard ${className}`}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
                gap: "10px",
                padding: "20px",
                ...style,
              }}
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <SkeletonLoader key={index} type="tile" />
              ))}
            </div>
          );

        default:
          return (
            <div
              className={`skeleton-default ${className}`}
              style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                animation: "pulse 1.5s ease-in-out infinite",
                ...style,
              }}
            />
          );
      }
    };

    if (count === 1) {
      return renderSkeleton();
    }

    return (
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
        ))}
      </div>
    );
  }
);

SkeletonLoader.displayName = "SkeletonLoader";

export default SkeletonLoader;
