import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useValidation, validateWithSchema, getFirstZodError, isValidBySchema } from '@/hooks/useValidation';
import { emailSchema, passwordSchema, loginSchema } from '@/lib/validation';

describe('useValidation Hook', () => {
  describe('validateEmail', () => {
    it('should return valid for correct email format', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateEmail('test@example.com');
        expect(validResult.isValid).toBe(true);
        expect(validResult.error).toBeNull();
      });
    });

    it('should return error for empty email', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateEmail('');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Email harus diisi');
      });
    });

    it('should return error for invalid email format', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateEmail('invalid-email');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Format email gak valid');
      });
    });
  });

  describe('validatePassword', () => {
    it('should return valid for password meeting minimum length', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validatePassword('password123', 8);
        expect(validResult.isValid).toBe(true);
        expect(validResult.error).toBeNull();
      });
    });

    it('should return error for empty password', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validatePassword('');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Password harus diisi');
      });
    });

    it('should return error for short password', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validatePassword('123', 8);
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Password minimal 8 karakter');
      });
    });
  });

  describe('validateConfirmPassword', () => {
    it('should return valid when passwords match', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateConfirmPassword('password123', 'password123');
        expect(validResult.isValid).toBe(true);
        expect(validResult.error).toBeNull();
      });
    });

    it('should return error when passwords do not match', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateConfirmPassword('password123', 'different');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Password gak sama');
      });
    });
  });

  describe('validateRequired', () => {
    it('should return valid for non-empty value', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateRequired('some value', 'Name');
        expect(validResult.isValid).toBe(true);
        expect(validResult.error).toBeNull();
      });
    });

    it('should return error for empty value', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateRequired('', 'Name');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Name harus diisi');
      });
    });

    it('should return error for whitespace-only value', () => {
      const { result } = renderHook(() => useValidation());

      act(() => {
        const validResult = result.current.validateRequired('   ', 'Name');
        expect(validResult.isValid).toBe(false);
        expect(validResult.error).toBe('Name harus diisi');
      });
    });
  });

  describe('validateAll', () => {
    it('should return true when all validations pass', () => {
      const { result } = renderHook(() => useValidation());

      let allValid: boolean;
      act(() => {
        allValid = result.current.validateAll([
          () => result.current.validateEmail('test@example.com'),
          () => result.current.validatePassword('password123', 8),
        ]);
      });

      expect(allValid!).toBe(true);
    });

    it('should return false when any validation fails', () => {
      const { result } = renderHook(() => useValidation());

      let allValid: boolean;
      act(() => {
        allValid = result.current.validateAll([
          () => result.current.validateEmail('test@example.com'),
          () => result.current.validatePassword('short', 8),
        ]);
      });

      expect(allValid!).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      const { result } = renderHook(() => useValidation());

      // First set an error
      act(() => {
        result.current.validateEmail('');
      });

      expect(result.current.error).toBe('Email harus diisi');

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('Zod Validation Helpers', () => {
  describe('validateWithSchema', () => {
    it('should return success with valid data', () => {
      const result = validateWithSchema(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should return errors for invalid data', () => {
      const result = validateWithSchema(emailSchema, 'invalid');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.firstError).toBeDefined();
    });

    it('should return field-level errors for object schemas', () => {
      const result = validateWithSchema(loginSchema, { email: '', password: '' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!['email']).toBeDefined();
      expect(result.errors!['password']).toBeDefined();
    });
  });

  describe('getFirstZodError', () => {
    it('should return null for valid data', () => {
      const error = getFirstZodError(emailSchema, 'test@example.com');
      expect(error).toBeNull();
    });

    it('should return first error message for invalid data', () => {
      const error = getFirstZodError(emailSchema, '');
      expect(error).toBe('Email tidak boleh kosong');
    });
  });

  describe('isValidBySchema', () => {
    it('should return true for valid data', () => {
      expect(isValidBySchema(emailSchema, 'test@example.com')).toBe(true);
    });

    it('should return false for invalid data', () => {
      expect(isValidBySchema(emailSchema, 'invalid')).toBe(false);
    });

    it('should work with password schema', () => {
      expect(isValidBySchema(passwordSchema, 'password123')).toBe(true);
      expect(isValidBySchema(passwordSchema, '123')).toBe(false);
    });
  });
});
