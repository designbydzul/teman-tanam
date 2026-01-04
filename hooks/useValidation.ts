'use client';

import { useState, useCallback, useMemo } from 'react';
import { z, ZodSchema } from 'zod';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('useValidation');

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// Validation rules for common fields
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface UseValidationReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Email validation
  validateEmail: (email: string) => ValidationResult;

  // Password validation
  validatePassword: (password: string, minLength?: number) => ValidationResult;

  // Confirm password validation
  validateConfirmPassword: (password: string, confirmPassword: string) => ValidationResult;

  // Required field validation
  validateRequired: (value: string, fieldName?: string) => ValidationResult;

  // Generic validation with custom rules
  validate: (value: string, rules: ValidationRules, fieldName?: string) => ValidationResult;

  // Validate multiple fields at once
  validateAll: (validations: Array<() => ValidationResult>) => boolean;
}

/**
 * useValidation Hook
 *
 * Centralized form validation with common validation rules.
 * Supports email, password, required fields, and custom validation.
 */
export function useValidation(): UseValidationReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validate email format
  const validateEmail = useCallback((email: string): ValidationResult => {
    const trimmed = email.trim();

    if (!trimmed) {
      const result = { isValid: false, error: 'Email harus diisi' };
      setError(result.error);
      debug.log('Email validation failed: empty');
      return result;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      const result = { isValid: false, error: 'Format email gak valid' };
      setError(result.error);
      debug.log('Email validation failed: invalid format');
      return result;
    }

    debug.log('Email validation passed');
    return { isValid: true, error: null };
  }, []);

  // Validate password
  const validatePassword = useCallback((password: string, minLength: number = 8): ValidationResult => {
    const trimmed = password.trim();

    if (!trimmed) {
      const result = { isValid: false, error: 'Password harus diisi' };
      setError(result.error);
      debug.log('Password validation failed: empty');
      return result;
    }

    if (trimmed.length < minLength) {
      const result = { isValid: false, error: `Password minimal ${minLength} karakter` };
      setError(result.error);
      debug.log('Password validation failed: too short');
      return result;
    }

    debug.log('Password validation passed');
    return { isValid: true, error: null };
  }, []);

  // Validate confirm password matches
  const validateConfirmPassword = useCallback((password: string, confirmPassword: string): ValidationResult => {
    if (password !== confirmPassword) {
      const result = { isValid: false, error: 'Password gak sama' };
      setError(result.error);
      debug.log('Confirm password validation failed: mismatch');
      return result;
    }

    debug.log('Confirm password validation passed');
    return { isValid: true, error: null };
  }, []);

  // Validate required field
  const validateRequired = useCallback((value: string, fieldName?: string): ValidationResult => {
    const trimmed = value.trim();

    if (!trimmed) {
      const field = fieldName || 'Field';
      const result = { isValid: false, error: `${field} harus diisi` };
      setError(result.error);
      debug.log(`Required validation failed: ${field} is empty`);
      return result;
    }

    debug.log('Required validation passed');
    return { isValid: true, error: null };
  }, []);

  // Generic validation with custom rules
  const validate = useCallback((value: string, rules: ValidationRules, fieldName?: string): ValidationResult => {
    const trimmed = value.trim();
    const field = fieldName || 'Field';

    // Required check
    if (rules.required && !trimmed) {
      const result = { isValid: false, error: `${field} harus diisi` };
      setError(result.error);
      return result;
    }

    // Min length check
    if (rules.minLength && trimmed.length < rules.minLength) {
      const result = { isValid: false, error: `${field} minimal ${rules.minLength} karakter` };
      setError(result.error);
      return result;
    }

    // Max length check
    if (rules.maxLength && trimmed.length > rules.maxLength) {
      const result = { isValid: false, error: `${field} maksimal ${rules.maxLength} karakter` };
      setError(result.error);
      return result;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(trimmed)) {
      const result = { isValid: false, error: `Format ${field} gak valid` };
      setError(result.error);
      return result;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(trimmed);
      if (customError) {
        const result = { isValid: false, error: customError };
        setError(result.error);
        return result;
      }
    }

    debug.log(`Validation passed for ${field}`);
    return { isValid: true, error: null };
  }, []);

  // Validate multiple fields at once - stops at first error
  const validateAll = useCallback((validations: Array<() => ValidationResult>): boolean => {
    clearError();

    for (const validation of validations) {
      const result = validation();
      if (!result.isValid) {
        return false;
      }
    }

    return true;
  }, [clearError]);

  return {
    error,
    setError,
    clearError,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateRequired,
    validate,
    validateAll,
  };
}

export default useValidation;

/**
 * Zod Schema Validation Helpers
 *
 * Standalone functions that can be used with Zod schemas directly.
 */

export interface ZodValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  firstError?: string;
}

/**
 * Validate data against a Zod schema
 * Returns parsed data or field-level errors
 */
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): ZodValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    const message = issue.message;

    if (!errors[path]) {
      errors[path] = message;
    }

    if (!firstError) {
      firstError = message;
    }
  }

  return { success: false, errors, firstError };
}

/**
 * Get first error message from a Zod schema validation
 */
export function getFirstZodError<T>(
  schema: ZodSchema<T>,
  data: unknown
): string | null {
  const result = validateWithSchema(schema, data);
  return result.firstError || null;
}

/**
 * Check if data is valid against a Zod schema
 */
export function isValidBySchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): boolean {
  return schema.safeParse(data).success;
}
