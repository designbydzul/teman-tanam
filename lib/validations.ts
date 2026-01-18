/**
 * Centralized Zod Validation Schemas
 *
 * All API input validation schemas are defined here for:
 * - Consistency across routes
 * - Reusability between frontend and API
 * - Clear Indonesian error messages
 */

import { z } from 'zod';

// =============================================================================
// Common Validators
// =============================================================================

/**
 * Indonesian phone number validation (WhatsApp format: 628xxx)
 * - Must start with 628
 * - Total length: 11-15 digits (628 + 8-12 digits)
 */
export const indonesianPhoneSchema = z
  .string()
  .regex(/^628\d{8,12}$/, 'Format nomor tidak valid. Harus dimulai dengan 628');

/**
 * Time format validation (HH:MM:SS)
 */
export const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
    'Format waktu tidak valid. Gunakan HH:MM:SS'
  );

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('ID tidak valid');

/**
 * Email validation with Indonesian message
 */
export const emailSchema = z.string().email('Email tidak valid');

// =============================================================================
// Auth Schemas
// =============================================================================

/**
 * Check email request schema
 */
export const checkEmailSchema = z.object({
  email: emailSchema,
});

/**
 * Delete account request schema
 */
export const deleteAccountSchema = z.object({
  userId: uuidSchema,
});

// =============================================================================
// Notification Schemas
// =============================================================================

/**
 * Notification settings update schema
 * Validates WhatsApp settings with conditional phone number requirement
 */
export const notificationSettingsSchema = z
  .object({
    whatsapp_enabled: z.boolean({
      error: 'whatsapp_enabled harus berupa boolean',
    }),
    whatsapp_number: z.string().nullable().optional(),
    reminder_time: timeSchema.optional().default('07:00:00'),
  })
  .refine(
    (data) => {
      // If WhatsApp is enabled, phone number is required
      if (data.whatsapp_enabled) {
        return !!data.whatsapp_number;
      }
      return true;
    },
    {
      message: 'Nomor WhatsApp harus diisi',
      path: ['whatsapp_number'],
    }
  )
  .refine(
    (data) => {
      // If WhatsApp is enabled and number provided, validate format
      if (data.whatsapp_enabled && data.whatsapp_number) {
        return /^628\d{8,12}$/.test(data.whatsapp_number);
      }
      return true;
    },
    {
      message: 'Format nomor tidak valid. Harus dimulai dengan 628',
      path: ['whatsapp_number'],
    }
  );

/**
 * Test notification request schema
 */
export const testNotificationSchema = z.object({
  phone_number: indonesianPhoneSchema,
});

// =============================================================================
// Chat Schemas (Tanya Tanam)
// =============================================================================

/**
 * Chat message schema
 */
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(10000, 'Pesan terlalu panjang'),
});

/**
 * Base64 image validation
 */
export const base64ImageSchema = z
  .string()
  .refine((val) => val.startsWith('data:image/'), {
    message: 'Format gambar tidak valid',
  });

/**
 * Tanya Tanam chat request schema
 */
export const tanyaTanamSchema = z
  .object({
    message: z.string().max(2000, 'Pesan terlalu panjang (maks 2000 karakter)').default(''),
    images: z.array(base64ImageSchema).max(3, 'Maksimal 3 gambar').default([]),
    plantContextText: z.string().max(5000).optional().nullable(),
    chatHistory: z.array(chatMessageSchema).default([]),
  })
  .refine((data) => data.message.trim().length > 0 || data.images.length > 0, {
    message: 'Pesan atau gambar harus diisi',
  });

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type CheckEmailInput = z.infer<typeof checkEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type TestNotificationInput = z.infer<typeof testNotificationSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type TanyaTanamInput = z.infer<typeof tanyaTanamSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format Zod errors into a single user-friendly message
 * Returns the first error message for simplicity
 */
export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || 'Data tidak valid';
}

/**
 * Format Zod errors with field paths (for debugging or detailed messages)
 */
export function formatZodErrorDetailed(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(', ');
}
