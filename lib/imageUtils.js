/**
 * Image compression and upload utilities for Teman Tanam
 */

/**
 * Compress an image file to a maximum size
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default 1024 = 1MB)
 * @param {number} maxWidth - Maximum width in pixels (default 1200)
 * @param {number} maxHeight - Maximum height in pixels (default 1200)
 * @returns {Promise<Blob>} - Compressed image as Blob
 */
export async function compressImage(file, maxSizeKB = 1024, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
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
        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality and reduce if needed
        let quality = 0.9;
        const maxSizeBytes = maxSizeKB * 1024;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              console.log(`[imageUtils] Compressed to ${(blob.size / 1024).toFixed(1)}KB at quality ${quality}`);

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

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique filename for plant photo
 * @param {string} userId - User ID
 * @param {string} plantId - Plant ID (can be 'new' for new plants)
 * @returns {string} - Path in storage bucket
 */
export function generatePhotoPath(userId, plantId) {
  const timestamp = Date.now();
  return `${userId}/${plantId}/${timestamp}.jpg`;
}

/**
 * Convert a Blob to a File object
 * @param {Blob} blob - The blob to convert
 * @param {string} filename - The filename for the new File
 * @returns {File} - File object
 */
export function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type });
}
