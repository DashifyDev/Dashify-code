"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Hook for image optimization and preloading
 */
export const useImageOptimization = (images = [], options = {}) => {
  const {
    priority = false,
    batchSize = 3,
    delay = 100,
    enablePreloading = true,
    enableBlurPlaceholder = true,
  } = options;

  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize image URLs to prevent unnecessary re-renders
  const imageUrls = useMemo(() => {
    return Array.isArray(images) ? images : [images].filter(Boolean);
  }, [images]);

  const preloadImage = useCallback(
    (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        if (priority) {
          img.loading = "eager";
        }

        const timeout = setTimeout(() => {
          reject(new Error("Image load timeout"));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(src);
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Image load failed"));
        };

        img.src = src;
      });
    },
    [priority],
  );

  const preloadImages = useCallback(async () => {
    if (!enablePreloading || imageUrls.length === 0) {
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);

    const totalImages = imageUrls.length;
    let processedImages = 0;

    try {
      for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);

        const promises = batch.map(async (src) => {
          try {
            await preloadImage(src);
            setLoadedImages((prev) => new Set([...prev, src]));
            return { src, success: true };
          } catch (error) {
            setFailedImages((prev) => new Set([...prev, src]));
            return { src, success: false, error };
          }
        });

        await Promise.allSettled(promises);

        processedImages += batch.length;
        const progress = Math.round((processedImages / totalImages) * 100);
        setLoadingProgress(progress);

        // Add delay between batches
        if (i + batchSize < imageUrls.length && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageUrls, enablePreloading, batchSize, delay, preloadImage]);

  // Generate blur placeholder for images
  const generateBlurPlaceholder = useCallback(
    async (src) => {
      if (!enableBlurPlaceholder) return null;

      try {
        // For external images, we'll use a generic placeholder
        if (src.startsWith("http")) {
          return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
        }

        // For local images, we could implement server-side blur generation
        return null;
      } catch (error) {
        console.warn("Failed to generate blur placeholder:", error);
        return null;
      }
    },
    [enableBlurPlaceholder],
  );

  // Get image loading status
  const getImageStatus = useCallback(
    (src) => {
      if (loadedImages.has(src)) return "loaded";
      if (failedImages.has(src)) return "failed";
      return "loading";
    },
    [loadedImages, failedImages],
  );

  // Check if all images are loaded
  const allImagesLoaded = useMemo(() => {
    return (
      imageUrls.length > 0 &&
      loadedImages.size + failedImages.size === imageUrls.length
    );
  }, [imageUrls.length, loadedImages.size, failedImages.size]);

  // Auto-preload images when they change
  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  return {
    loadedImages,
    failedImages,
    loadingProgress,
    isLoading,
    allImagesLoaded,
    getImageStatus,
    generateBlurPlaceholder,
    preloadImages,
  };
};

/**
 * Hook for responsive image handling
 */
export const useResponsiveImage = (src, options = {}) => {
  const {
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    priority = false,
    quality = 85,
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const imageProps = useMemo(
    () => ({
      src,
      sizes,
      priority,
      quality,
      onLoad: handleLoad,
      onError: handleError,
    }),
    [src, sizes, priority, quality, handleLoad, handleError],
  );

  return {
    imageProps,
    isLoaded,
    hasError,
  };
};
