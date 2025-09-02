"use client";

import React, { useState, useCallback, memo } from "react";
import Image from "next/image";

const OptimizedImage = memo(
  ({
    src,
    alt = "Image",
    width,
    height,
    className = "",
    style = {},
    priority = false,
    quality = 75,
    placeholder = "blur",
    blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    onLoad,
    onError,
    ...props
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      if (onLoad) onLoad();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
    }, [onError]);

    if (!src) {
      return (
        <div
          className={`optimized-image-placeholder ${className}`}
          style={{
            width: width || "100%",
            height: height || "200px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            ...style,
          }}
        >
          No image
        </div>
      );
    }

    if (hasError) {
      return (
        <div
          className={`optimized-image-error ${className}`}
          style={{
            width: width || "100%",
            height: height || "200px",
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            border: "1px dashed #ddd",
            ...style,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
            <div style={{ fontSize: "12px" }}>Image failed to load</div>
          </div>
        </div>
      );
    }

    const isDataUrl = src.startsWith("data:");
    const isExternalUrl = src.startsWith("http");

    if (isDataUrl || isExternalUrl) {
      return (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`optimized-image ${className}`}
          style={{
            ...style,
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      );
    }

    return (
      <div
        className={`optimized-image-container ${className}`}
        style={{
          position: "relative",
          width: width || "100%",
          height: height || "auto",
          ...style,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
          {...props}
        />

        {}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#999",
              fontSize: "12px",
            }}
          >
            Loading...
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
