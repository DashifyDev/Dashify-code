"use client";

import React from "react";

const ImageSkeleton = ({
  width = "100%",
  height = "200px",
  className = "",
  borderRadius = "8px",
  animation = "pulse",
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case "wave":
        return "animate-wave";
      case "fade":
        return "animate-fade";
      case "pulse":
      default:
        return "animate-pulse";
    }
  };

  return (
    <div
      className={`image-skeleton ${getAnimationClass()} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "#f0f0f0",
        background:
          "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: animation === "wave" ? "wave 1.5s infinite" : undefined,
      }}
    >
      <style jsx>{`
        @keyframes wave {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes fade {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 0.3;
          }
        }

        .image-skeleton {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .image-skeleton::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default ImageSkeleton;
