/**
 * Shared Input Component
 *
 * Reusable input with consistent styling across the app.
 * Includes accessibility features: ARIA labels, error states, descriptions.
 */

'use client';

import React, { useState, InputHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  /** Optional right-aligned icon or action */
  rightIcon?: ReactNode;
  /** Custom styles for the input */
  style?: CSSProperties;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Label for the input (also used for aria-label if no id) */
  label?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  autoFocus = false,
  rightIcon,
  style = {},
  error,
  helperText,
  label,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Generate IDs for accessibility linking
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;

  // Build aria-describedby from error, helper, and custom values
  const describedByParts: string[] = [];
  if (error && errorId) describedByParts.push(errorId);
  if (helperText && helperId && !error) describedByParts.push(helperId);
  if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
  const computedDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={ariaLabel || label || placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={computedDescribedBy}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: rightIcon ? '18px 50px 18px 18px' : '18px',
          fontSize: '1rem',
          fontFamily: "'Inter', sans-serif",
          color: '#2C2C2C',
          backgroundColor: '#FAFAFA',
          border: error ? '2px solid #F44336' : 'none',
          borderRadius: '12px',
          outline: 'none',
          boxShadow: isFocused && !error ? 'inset 0 0 0 2px #7CB342' : 'none',
          ...style,
        }}
        {...props}
      />
      {rightIcon && (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rightIcon}
        </div>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: '6px 0 0 0',
            fontSize: '0.875rem',
            color: '#F44336',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={helperId}
          style={{
            margin: '6px 0 0 0',
            fontSize: '0.75rem',
            color: '#999999',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
