"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useImageOptimization } from "@/hooks/useImageOptimization";
import ImageSkeleton from "./ImageSkeleton";
import VirtualizedGrid from "./VirtualizedGrid";

const OptimizedDashboardLoader = ({
  dashboardData,
  onLoadComplete,
  showProgress = true,
  enablePreloading = true,
  virtualScrolling = false,
}) => {
  const [loadingStage, setLoadingStage] = useState("initializing");
  const [progress, setProgress] = useState(0);

  // Extract all image URLs from dashboard data
  const allImageUrls = useMemo(() => {
    if (!dashboardData) return [];

    const urls = new Set();

    // Extract from tiles
    if (dashboardData.tiles) {
      dashboardData.tiles.forEach((tile) => {
        if (tile.tileBackground) {
          urls.add(tile.tileBackground);
        }
        if (tile.image) {
          urls.add(tile.image);
        }
      });
    }

    // Extract from pods
    if (dashboardData.pods) {
      dashboardData.pods.forEach((pod) => {
        if (pod.backgroundImage) {
          urls.add(pod.backgroundImage);
        }
      });
    }

    return Array.from(urls);
  }, [dashboardData]);

  // Use image optimization hook
  const {
    loadedImages,
    failedImages,
    loadingProgress,
    isLoading,
    allImagesLoaded,
  } = useImageOptimization(allImageUrls, {
    batchSize: 4,
    delay: 100,
    enablePreloading,
  });

  // Update loading progress
  useEffect(() => {
    if (isLoading) {
      setLoadingStage("loading_images");
      setProgress(loadingProgress);
    } else if (allImagesLoaded) {
      setLoadingStage("completed");
      setProgress(100);
      onLoadComplete?.(loadedImages, failedImages);
    }
  }, [
    isLoading,
    loadingProgress,
    allImagesLoaded,
    loadedImages,
    failedImages,
    onLoadComplete,
  ]);

  // Render loading overlay
  const renderLoadingOverlay = () => {
    if (!showProgress || loadingStage === "completed") return null;

    return (
      <div
        style={{
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
        }}
      >
        <div
          style={{
            width: "300px",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#333" }}>
            Loading Dashboard...
          </h3>

          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#4CAF50",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {loadingStage === "loading_images" && "Loading images..."}
            {loadingStage === "initializing" && "Initializing..."}
          </p>

          <p style={{ margin: "8px 0 0 0", color: "#999", fontSize: "12px" }}>
            {loadedImages.size} / {allImageUrls.length} images loaded
          </p>
        </div>
      </div>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => {
    if (!dashboardData) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            color: "#999",
          }}
        >
          No dashboard data available
        </div>
      );
    }

    if (virtualScrolling && dashboardData.tiles?.length > 50) {
      // Use virtual scrolling for large dashboards
      return (
        <VirtualizedGrid
          items={dashboardData.tiles}
          itemWidth={200}
          itemHeight={150}
          containerWidth={800}
          containerHeight={600}
          onItemClick={(item, index) => {
            console.log("Tile clicked:", item, index);
          }}
          renderItem={(item, index, imageStatus) => (
            <div
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                backgroundColor: item.backgroundColor || "#f5f5f5",
              }}
            >
              {item.tileBackground && imageStatus === "loading" && (
                <ImageSkeleton width="100%" height="100%" />
              )}
              {item.tileBackground && imageStatus === "loaded" && (
                <img
                  src={item.tileBackground}
                  alt={item.title || "Tile"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
              {item.title && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    color: "white",
                    padding: "8px",
                    fontSize: "12px",
                  }}
                >
                  {item.title}
                </div>
              )}
            </div>
          )}
        />
      );
    }

    // Regular grid layout for smaller dashboards
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          padding: "16px",
        }}
      >
        {dashboardData.tiles?.map((tile, index) => (
          <div
            key={tile._id || index}
            style={{
              width: "100%",
              height: "150px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              backgroundColor: tile.backgroundColor || "#f5f5f5",
            }}
          >
            {tile.tileBackground && (
              <img
                src={tile.tileBackground}
                alt={tile.title || "Tile"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            )}
            {tile.title && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  color: "white",
                  padding: "8px",
                  fontSize: "12px",
                }}
              >
                {tile.title}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {renderLoadingOverlay()}
      {renderDashboardContent()}
    </div>
  );
};

export default OptimizedDashboardLoader;
