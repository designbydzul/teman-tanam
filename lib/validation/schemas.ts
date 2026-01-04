'use client';

import { z } from 'zod';

/**
 * Auth Validation Schemas
 */
export const emailSchema = z
  .string()
  .min(1, 'Email tidak boleh kosong')
  .email('Format email tidak valid');

export const passwordSchema = z
  .string()
  .min(6, 'Password minimal 6 karakter')
  .max(128, 'Password maksimal 128 karakter');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

/**
 * Plant Validation Schemas
 */
export const plantNameSchema = z
  .string()
  .min(1, 'Nama tanaman tidak boleh kosong')
  .max(50, 'Nama tanaman maksimal 50 karakter')
  .trim();

export const locationSchema = z
  .string()
  .min(1, 'Lokasi tidak boleh kosong')
  .max(50, 'Lokasi maksimal 50 karakter')
  .trim();

export const notesSchema = z
  .string()
  .max(500, 'Catatan maksimal 500 karakter')
  .optional();

export const customDaysSchema = z
  .number()
  .min(1, 'Minimal 1 hari')
  .max(365, 'Maksimal 365 hari')
  .optional()
  .nullable();

export const addPlantFormSchema = z.object({
  customName: plantNameSchema,
  location: locationSchema,
  startedDate: z.string().min(1, 'Pilih tanggal mulai'),
  notes: notesSchema,
});

export const editPlantFormSchema = z.object({
  customName: plantNameSchema,
  location: locationSchema,
  startedDate: z.string().min(1, 'Pilih tanggal mulai'),
  notes: notesSchema,
  customWateringDays: customDaysSchema,
  customFertilizingDays: customDaysSchema,
});

/**
 * Profile Validation Schemas
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Nama tidak boleh kosong')
  .max(50, 'Nama maksimal 50 karakter')
  .trim();

export const editProfileSchema = z.object({
  displayName: displayNameSchema,
});

/**
 * Location Settings Validation Schema
 */
export const addLocationSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama lokasi tidak boleh kosong')
    .max(30, 'Nama lokasi maksimal 30 karakter')
    .trim(),
});

/**
 * Chat/TanyaTanam Validation Schema
 */
export const chatMessageSchema = z
  .string()
  .min(1, 'Pesan tidak boleh kosong')
  .max(2000, 'Pesan maksimal 2000 karakter')
  .trim();

/**
 * Type exports for use in components
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type AddPlantFormData = z.infer<typeof addPlantFormSchema>;
export type EditPlantFormData = z.infer<typeof editPlantFormSchema>;
export type EditProfileFormData = z.infer<typeof editProfileSchema>;
export type AddLocationFormData = z.infer<typeof addLocationSchema>;
