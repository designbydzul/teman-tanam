/**
 * Image compression and upload utilities for Teman Tanam
 */

import { createDebugger } from '@/lib/debug';

const debug = createDebugger('imageUtils');

/**
 * Compress an image file to a maximum size
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in KB (default 1024 = 1MB)
 * @param maxWidth - Maximum width in pixels (default 1200)
 * @param maxHeight - Maximum height in pixels (default 1200)
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = 1024,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality and reduce if needed
        let quality = 0.9;
        const maxSizeBytes = maxSizeKB * 1024;

        const tryCompress = (): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              debug.log(`Compressed to ${(blob.size / 1024).toFixed(1)}KB at quality ${quality}`);

              // If still too large and quality can be reduced
              if (blob.size > maxSizeBytes && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
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
