"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

const ImagePreloader = ({
  images,
  onComplete,
  onProgress,
  priority = false,
  batchSize = 3,
  delay = 100,
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const isMountedRef = useRef(true);

  const preloadImage = useCallback(
    (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        // Set loading priority
        if (priority) {
          img.loading = "eager";
        }

        img.onload = () => {
          if (isMountedRef.current) {
            resolve(src);
          }
        };
        img.onerror = () => {
          if (isMountedRef.current) {
            reject(src);
          }
        };

        // Add timeout for failed images
        const timeout = setTimeout(() => {
          if (isMountedRef.current) {
            reject(src);
          }
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          if (isMountedRef.current) {
            resolve(src);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          if (isMountedRef.current) {
            reject(src);
          }
        };

        img.src = src;
      });
    },
    [priority]
  );

  const preloadBatch = useCallback(
    async (imageBatch) => {
      const promises = imageBatch.map(async (src) => {
        try {
          await preloadImage(src);
          if (isMountedRef.current) {
            setLoadedImages((prev) => new Set([...prev, src]));
            return { src, success: true };
          }
        } catch (error) {
          if (isMountedRef.current) {
            setFailedImages((prev) => new Set([...prev, src]));
            return { src, success: false };
          }
        }
      });

      return Promise.allSettled(promises);
    },
    [preloadImage]
  );

  useEffect(() => {
    if (!images || images.length === 0) {
      onComplete?.();
      return;
    }

    const preloadImages = async () => {
      const totalImages = images.length;
      let processedImages = 0;

      // Process images in batches to avoid overwhelming the browser
      for (let i = 0; i < images.length; i += batchSize) {
        if (!isMountedRef.current) break;

        const batch = images.slice(i, i + batchSize);
        await preloadBatch(batch);

        processedImages += batch.length;
        const currentProgress = Math.round(
          (processedImages / totalImages) * 100
        );

        if (isMountedRef.current) {
          setProgress(currentProgress);
          onProgress?.(currentProgress, processedImages, totalImages);
        }

        // Add delay between batches to prevent blocking
        if (i + batchSize < images.length && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (isMountedRef.current) {
        onComplete?.(loadedImages, failedImages);
      }
    };

    preloadImages();

    return () => {
      isMountedRef.current = false;
    };
  }, [
    images,
    preloadBatch,
    onComplete,
    onProgress,
    batchSize,
    delay,
    loadedImages,
    failedImages,
  ]);

  return null;
};

export default ImagePreloader;
