'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('useNotificationSettings');

// Types
export interface NotificationSettings {
  id: string;
  user_id: string;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  reminder_time: string; // Format: "HH:MM:SS" from database TIME type
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  sent_at: string;
  plants_count: number;
  message_preview: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null;
  logs: NotificationLog[];
  loading: boolean;
  logsLoading: boolean;
  error: string | null;
  updateSettings: (enabled: boolean, phoneNumber: string | null, reminderTime?: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
  fetchLogs: (limit?: number) => Promise<void>;
}

/**
 * Format Indonesian phone number to standard format (628xxx)
 * Valid formats to accept:
 * - 081234567890 → convert to 6281234567890
 * - 81234567890 → convert to 6281234567890
 * - 628123456789 → keep as is
 * - +628123456789 → convert to 628123456789
 */
export function formatWhatsAppNumber(input: string): string {
  // Remove all non-digits
  let number = input.replace(/\D/g, '');

  // Remove leading 0 if present
  if (number.startsWith('0')) {
    number = number.substring(1);
  }

  // Add 62 if not present
  if (!number.startsWith('62')) {
    number = '62' + number;
  }

  return number;
}

/**
 * Validate Indonesian phone number
 * Should be 62 + 9-12 digits (total 11-14 digits)
 */
export function isValidIndonesianNumber(number: string): boolean {
  const formatted = formatWhatsAppNumber(number);
  return /^62[0-9]{9,12}$/.test(formatted);
}

/**
 * useNotificationSettings Hook
 *
 * Manages user's WhatsApp notification settings.
 */
export function useNotificationSettings(): UseNotificationSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from Supabase
  const fetchSettings = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      debug.log('Fetching notification settings for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // PGRST116 = no rows found, which is OK for first time users
        if (fetchError.code === 'PGRST116') {
          debug.log('No notification settings found, user has not set up yet');
          setSettings(null);
        } else {
          debug.error('Error fetching notification settings:', fetchError);
          throw fetchError;
        }
      } else {
        debug.log('Fetched notification settings:', data);
        setSettings(data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      debug.error('Error:', err);
      setError(errorMessage || 'Gagal memuat pengaturan notifikasi');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch notification logs
  const fetchLogs = useCallback(async (limit: number = 5): Promise<void> => {
    if (!user?.id) {
      setLogs([]);
      return;
    }

    setLogsLoading(true);

    try {
      debug.log('Fetching notification logs for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        debug.error('Error fetching notification logs:', fetchError);
        throw fetchError;
      }

      debug.log('Fetched notification logs:', data?.length || 0);
      setLogs(data || []);
    } catch (err: unknown) {
      debug.error('Error fetching logs:', err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [user?.id]);

  // Update settings
  const updateSettings = async (
    enabled: boolean,
    phoneNumber: string | null,
    reminderTime?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Kamu belum login. Silakan login dulu ya!' };
    }

    try {
      debug.log('Updating notification settings:', { enabled, phoneNumber, reminderTime });

      // Format phone number if provided
      const formattedNumber = phoneNumber ? formatWhatsAppNumber(phoneNumber) : null;

      // Validate phone number if enabling notifications
      if (enabled && formattedNumber && !isValidIndonesianNumber(formattedNumber)) {
        return { success: false, error: 'Format nomor gak valid. Contoh: 81234567890' };
      }

      const updateData: {
        user_id: string;
        whatsapp_enabled: boolean;
        whatsapp_number: string | null;
        updated_at: string;
        reminder_time?: string;
      } = {
        user_id: user.id,
        whatsapp_enabled: enabled,
        whatsapp_number: formattedNumber,
        updated_at: new Date().toISOString(),
      };

      // Add reminder_time if provided
      if (reminderTime) {
        updateData.reminder_time = reminderTime;
      }

      // Use upsert to create or update
      const { data, error: upsertError } = await supabase
        .from('notification_settings')
        .upsert(updateData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (upsertError) {
        debug.error('Error updating notification settings:', upsertError);
        throw upsertError;
      }

      debug.log('Settings updated successfully:', data);
      setSettings(data);

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      debug.error('Error updating settings:', err);
      return { success: false, error: errorMessage || 'Gagal simpan. Coba lagi ya!' };
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    logs,
    loading,
    logsLoading,
    error,
    updateSettings,
    refetch: fetchSettings,
    fetchLogs,
  };
}

export default useNotificationSettings;
