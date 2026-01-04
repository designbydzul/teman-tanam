'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('useToast');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
}

export interface ShowToastOptions {
  title?: string;
  type?: ToastType;
  duration?: number;
}

export interface UseToastReturn {
  // Simple toast (single message, auto-dismiss)
  toast: Toast | null;
  showToast: (message: string, options?: ShowToastOptions) => void;
  hideToast: () => void;

  // Network toast (title + message)
  networkToast: { title: string; message: string } | null;
  showNetworkToast: (title: string, message: string, duration?: number) => void;
  hideNetworkToast: () => void;
}

const DEFAULT_DURATION = 3000;

/**
 * useToast Hook
 *
 * Centralized toast notification management.
 * Supports simple action toasts and network status toasts.
 * Handles auto-dismiss timers with proper cleanup.
 */
export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<Toast | null>(null);
  const [networkToast, setNetworkToast] = useState<{ title: string; message: string } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const networkToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (networkToastTimerRef.current) {
        clearTimeout(networkToastTimerRef.current);
      }
    };
  }, []);

  // Generate unique ID for toast
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Show simple toast
  const showToast = useCallback((message: string, options: ShowToastOptions = {}) => {
    const { title, type = 'success', duration = DEFAULT_DURATION } = options;

    // Clear existing timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    const newToast: Toast = {
      id: generateId(),
      message,
      title,
      type,
      duration,
    };

    setToast(newToast);
    debug.log('Toast shown:', { message, type, duration });

    // Auto-dismiss
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      debug.log('Toast auto-dismissed');
    }, duration);
  }, [generateId]);

  // Hide simple toast
  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
    debug.log('Toast manually hidden');
  }, []);

  // Show network toast (with title and message)
  const showNetworkToast = useCallback((title: string, message: string, duration: number = DEFAULT_DURATION) => {
    // Clear existing timer
    if (networkToastTimerRef.current) {
      clearTimeout(networkToastTimerRef.current);
    }

    setNetworkToast({ title, message });
    debug.log('Network toast shown:', { title, message });

    // Auto-dismiss
    networkToastTimerRef.current = setTimeout(() => {
      setNetworkToast(null);
      debug.log('Network toast auto-dismissed');
    }, duration);
  }, []);

  // Hide network toast
  const hideNetworkToast = useCallback(() => {
    if (networkToastTimerRef.current) {
      clearTimeout(networkToastTimerRef.current);
    }
    setNetworkToast(null);
    debug.log('Network toast manually hidden');
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    networkToast,
    showNetworkToast,
    hideNetworkToast,
  };
}

export default useToast;
