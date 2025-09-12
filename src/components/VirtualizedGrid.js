"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { FixedSizeGrid as Grid } from "react-window";
import ImageSkeleton from "./ImageSkeleton";
import { useImageOptimization } from "@/hooks/useImageOptimization";

const VirtualizedGrid = ({
  items = [],
  itemWidth = 200,
  itemHeight = 150,
  containerWidth = 800,
  containerHeight = 600,
  overscan = 5,
  onItemClick,
  renderItem,
  className = "",
}) => {
  const [containerSize, setContainerSize] = useState({
    width: containerWidth,
    height: containerHeight,
  });

  const gridRef = useRef(null);

  // Calculate grid dimensions
  const columnCount = Math.floor(containerSize.width / itemWidth);
  const rowCount = Math.ceil(items.length / columnCount);

  // Extract image URLs for preloading
  const imageUrls = useMemo(() => {
    return items
      .map((item) => item.image || item.tileBackground || item.src)
      .filter(Boolean);
  }, [items]);

  // Use image optimization hook
  const { loadedImages, getImageStatus } = useImageOptimization(imageUrls, {
    batchSize: 6,
    delay: 50,
  });

  // Update container size on resize
  useEffect(() => {
    const handleResize = () => {
      setContainerSize({
        width: containerWidth,
        height: containerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerWidth, containerHeight]);

  // Item renderer for virtual grid
  const ItemRenderer = useCallback(
    ({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * columnCount + columnIndex;
      const item = items[index];

      if (!item) {
        return <div style={style} />;
      }

      const imageSrc = item.image || item.tileBackground || item.src;
      const imageStatus = getImageStatus(imageSrc);

      return (
        <div
          style={{
            ...style,
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => onItemClick?.(item, index)}
        >
          {renderItem ? (
            renderItem(item, index, imageStatus)
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
              }}
            >
              {imageSrc && imageStatus === "loading" && (
                <ImageSkeleton width="100%" height="100%" animation="wave" />
              )}
              {imageSrc && imageStatus === "loaded" && (
                <img
                  src={imageSrc}
                  alt={item.alt || item.title || "Item"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              )}
              {imageSrc && imageStatus === "failed" && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  📷
                </div>
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
        </div>
      );
    },
    [items, columnCount, getImageStatus, renderItem, onItemClick]
  );

  if (items.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No items to display
      </div>
    );
  }

  return (
    <div className={className}>
      <Grid
        ref={gridRef}
        columnCount={columnCount}
        columnWidth={itemWidth}
        height={containerSize.height}
        rowCount={rowCount}
        rowHeight={itemHeight}
        width={containerSize.width}
        overscanRowCount={overscan}
        overscanColumnCount={overscan}
      >
        {ItemRenderer}
      </Grid>
    </div>
  );
};

export default VirtualizedGrid;
