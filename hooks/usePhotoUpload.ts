'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createDebugger } from '@/lib/debug';
import { compressImage } from '@/lib/imageUtils';

const debug = createDebugger('usePhotoUpload');

// Default compression settings
const DEFAULT_MAX_SIZE_KB = 1024; // 1MB
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const LARGE_FILE_THRESHOLD_MB = 5;

export interface PhotoState {
  file: File | null;
  compressedBlob: Blob | null;
  preview: string | null;
}

export interface UsePhotoUploadOptions {
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  autoCompress?: boolean;
}

export interface UsePhotoUploadReturn {
  // State
  photo: PhotoState;
  isCompressing: boolean;
  warning: string | null;
  error: string | null;

  // Actions
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFileSelect: (file: File) => Promise<void>;
  clearPhoto: () => void;
  getUploadFile: () => File | Blob | null;

  // Ref for file input
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileSelect: () => void;
}

/**
 * usePhotoUpload Hook
 *
 * Centralized photo upload handling with compression.
 * Features:
 * - Automatic image compression
 * - Preview generation
 * - File size warnings
 * - Proper cleanup of object URLs
 */
export function usePhotoUpload(options: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  const {
    maxSizeKB = DEFAULT_MAX_SIZE_KB,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    autoCompress = true,
  } = options;

  const [photo, setPhoto] = useState<PhotoState>({
    file: null,
    compressedBlob: null,
    preview: null,
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (photo.preview && photo.preview.startsWith('blob:')) {
        URL.revokeObjectURL(photo.preview);
        debug.log('Cleaned up preview URL');
      }
    };
  }, [photo.preview]);

  // Process a file (compression + preview)
  const processFile = useCallback(async (file: File) => {
    setIsCompressing(true);
    setWarning(null);
    setError(null);

    debug.log(`Processing file: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB`);

    // Generate preview immediately
    const reader = new FileReader();
    const previewPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
    reader.readAsDataURL(file);

    try {
      const preview = await previewPromise;

      // Update state with file and preview
      setPhoto(prev => ({
        ...prev,
        file,
        preview,
      }));

      // Compress if enabled
      if (autoCompress) {
        try {
          debug.log(`Compressing image (max ${maxSizeKB}KB, ${maxWidth}x${maxHeight})`);
          const compressedBlob = await compressImage(file, maxSizeKB, maxWidth, maxHeight);
          debug.log(`Compressed to: ${(compressedBlob.size / 1024).toFixed(1)}KB`);

          setPhoto(prev => ({
            ...prev,
            compressedBlob,
          }));
        } catch (compressionError) {
          debug.error('Compression failed:', compressionError);

          // Fall back to original file
          setPhoto(prev => ({
            ...prev,
            compressedBlob: null,
          }));

          // Warn about large files
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB > LARGE_FILE_THRESHOLD_MB) {
            setWarning(`Foto terlalu besar (${fileSizeMB.toFixed(1)}MB). Mungkin gagal upload, coba pilih foto lain.`);
          } else {
            setWarning('Kompresi gagal, menggunakan foto asli.');
          }
        }
      }
    } catch (readError) {
      debug.error('Failed to read file:', readError);
      setError('Gagal membaca file. Coba pilih foto lain.');
    } finally {
      setIsCompressing(false);
    }
  }, [autoCompress, maxSizeKB, maxWidth, maxHeight]);

  // Handle file input change event
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  // Handle direct file selection (e.g., from drag and drop)
  const handleFileSelect = useCallback(async (file: File) => {
    await processFile(file);
  }, [processFile]);

  // Clear photo state
  const clearPhoto = useCallback(() => {
    // Cleanup preview URL
    if (photo.preview && photo.preview.startsWith('blob:')) {
      URL.revokeObjectURL(photo.preview);
    }

    setPhoto({
      file: null,
      compressedBlob: null,
      preview: null,
    });
    setWarning(null);
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    debug.log('Photo cleared');
  }, [photo.preview]);

  // Get the best file for upload (compressed if available, otherwise original)
  const getUploadFile = useCallback((): File | Blob | null => {
    if (photo.compressedBlob) {
      return photo.compressedBlob;
    }
    return photo.file;
  }, [photo.compressedBlob, photo.file]);

  // Trigger file input click
  const triggerFileSelect = useCallback(() => {
    if (!isCompressing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isCompressing]);

  return {
    photo,
    isCompressing,
    warning,
    error,
    handleFileChange,
    handleFileSelect,
    clearPhoto,
    getUploadFile,
    fileInputRef,
    triggerFileSelect,
  };
}

export default usePhotoUpload;
