/**
 * Image compression and upload utilities for Teman Tanam
 * Uses browser-image-compression for efficient client-side compression
 */

import imageCompression from 'browser-image-compression';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('imageUtils');

/**
 * Compression settings for Teman Tanam
 * - maxSizeMB: Target file size (0.2MB = 200KB)
 * - maxWidthOrHeight: Max dimension in pixels
 * - useWebWorker: Process in background thread (doesn't freeze UI)
 * - fileType: Output format
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,           // 200KB target
  maxWidthOrHeight: 1200,   // Max 1200px on longest side
  useWebWorker: true,       // Better performance
  fileType: 'image/jpeg' as const,  // Convert all to JPEG
  initialQuality: 0.8,      // 80% quality
};

/**
 * Size threshold for skipping compression (200KB)
 */
const SKIP_COMPRESSION_THRESHOLD = 200 * 1024;

/**
 * Compress an image file before upload
 * @param file - The original image file from input or camera
 * @param maxSizeKB - Maximum size in KB (default 200 = 200KB) - for backwards compatibility
 * @param maxWidth - Maximum width in pixels (default 1200) - for backwards compatibility
 * @param maxHeight - Maximum height in pixels (default 1200) - for backwards compatibility
 * @returns Compressed image as Blob (or File)
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = 200,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<Blob> {
  // Skip if already small enough (under threshold)
  if (file.size <= SKIP_COMPRESSION_THRESHOLD) {
    debug.log('Image already small, skipping compression:', `${(file.size / 1024).toFixed(1)}KB`);
    return file;
  }

  try {
    debug.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const options = {
      ...COMPRESSION_OPTIONS,
      maxSizeMB: maxSizeKB / 1024, // Convert KB to MB
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    };

    const compressedFile = await imageCompression(file, options);

    debug.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    debug.log(`Reduction: ${((1 - compressedFile.size / file.size) * 100).toFixed(0)}%`);

    return compressedFile;
  } catch (error) {
    debug.error('Compression failed, using original:', error);
    // If compression fails, return original file
    // Better to upload large file than fail completely
    return file;
  }
}

/**
 * Compress image and convert to base64 (for offline storage)
 * @param file - The original image file
 * @returns Base64 string of compressed image
 */
export async function compressImageToBase64(file: File): Promise<string> {
  const compressedFile = await compressImage(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
}

/**
 * Get image dimensions (useful for debugging/logging)
 * @param file - The image file
 * @returns Object with width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a unique filename for plant photo
 * @param userId - User ID
 * @param plantId - Plant ID (can be 'new' for new plants)
 * @returns Path in storage bucket
 */
export function generatePhotoPath(userId: string, plantId: string): string {
  const timestamp = Date.now();
  return `${userId}/${plantId}/${timestamp}.jpg`;
}

/**
 * Convert a Blob to a File object
 * @param blob - The blob to convert
 * @param filename - The filename for the new File
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
