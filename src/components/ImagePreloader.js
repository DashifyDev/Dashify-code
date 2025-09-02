"use client";

import React, { useEffect, useState, useCallback } from "react";

const ImagePreloader = ({ images, onComplete }) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  const preloadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(src);
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!images || images.length === 0) {
      onComplete?.();
      return;
    }

    const preloadImages = async () => {
      const promises = images.map(async (src) => {
        try {
          await preloadImage(src);
          setLoadedImages((prev) => new Set([...prev, src]));
          return { src, success: true };
        } catch (error) {
          setFailedImages((prev) => new Set([...prev, src]));
          return { src, success: false };
        }
      });

      await Promise.allSettled(promises);
      onComplete?.();
    };

    preloadImages();
  }, [images, preloadImage, onComplete]);

  return null; 
};

export default ImagePreloader;
