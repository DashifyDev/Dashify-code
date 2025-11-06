"use client";

import sharp from "sharp";

/**
 * Optimize image for web delivery
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} Optimized image buffer
 */
export const optimizeImage = async (imageBuffer, options = {}) => {
  const {
    width = 1920,
    height = 1080,
    quality = 85,
    format = "webp",
    progressive = true,
    strip = true,
  } = options;

  try {
    let pipeline = sharp(imageBuffer);

    // Get image metadata
    const metadata = await pipeline.metadata();
    const { width: originalWidth, height: originalHeight } = metadata;

    // Calculate optimal dimensions while maintaining aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    let targetWidth = width;
    let targetHeight = height;

    if (aspectRatio > 1) {
      // Landscape
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else {
      // Portrait
      targetWidth = Math.round(targetHeight * aspectRatio);
    }

    // Resize image
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Apply format-specific optimizations
    switch (format) {
      case "webp":
        pipeline = pipeline.webp({
          quality,
          progressive,
          effort: 6, // Higher effort for better compression
        });
        break;
      case "avif":
        pipeline = pipeline.avif({
          quality,
          effort: 4,
        });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality,
          progressive,
          mozjpeg: true, // Use mozjpeg encoder
        });
        break;
      case "png":
        pipeline = pipeline.png({
          quality,
          progressive,
          compressionLevel: 9,
        });
        break;
      default:
        pipeline = pipeline.webp({ quality, progressive });
    }

    // Strip metadata for smaller file size
    if (strip) {
      pipeline = pipeline.strip();
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error("Image optimization failed:", error);
    throw new Error("Failed to optimize image");
  }
};

/**
 * Generate responsive image sizes
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Array} sizes - Array of sizes to generate
 * @returns {Promise<Array>} Array of optimized images
 */
export const generateResponsiveImages = async (
  imageBuffer,
  sizes = [640, 750, 828, 1080, 1200, 1920],
) => {
  const optimizedImages = [];

  for (const size of sizes) {
    try {
      const optimized = await optimizeImage(imageBuffer, {
        width: size,
        quality: size <= 640 ? 90 : 85, // Higher quality for smaller images
        format: "webp",
      });

      optimizedImages.push({
        width: size,
        buffer: optimized,
        size: optimized.length,
      });
    } catch (error) {
      console.error(`Failed to generate ${size}px image:`, error);
    }
  }

  return optimizedImages;
};

/**
 * Generate blur placeholder for image
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string>} Base64 blur placeholder
 */
export const generateBlurPlaceholder = async (imageBuffer) => {
  try {
    const blurBuffer = await sharp(imageBuffer)
      .resize(10, 10, { fit: "inside" })
      .jpeg({ quality: 20 })
      .toBuffer();

    return `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Failed to generate blur placeholder:", error);
    // Return a generic placeholder
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
  }
};

/**
 * Check if image needs optimization
 * @param {Object} metadata - Image metadata
 * @param {Object} options - Optimization options
 * @returns {boolean} Whether image needs optimization
 */
export const needsOptimization = (metadata, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1080, maxFileSize = 500000 } = options; // 500KB
  const { width, height, size } = metadata;

  return width > maxWidth || height > maxHeight || size > maxFileSize;
};

/**
 * Get optimal image format based on browser support
 * @param {string} userAgent - User agent string
 * @returns {string} Optimal format
 */
export const getOptimalFormat = (userAgent = "") => {
  if (userAgent.includes("Chrome") || userAgent.includes("Firefox")) {
    return "avif";
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "webp";
  }
  return "webp"; // Default fallback
};
