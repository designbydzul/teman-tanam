/**
 * Shared Input Component
 *
 * Reusable input with consistent styling across the app
 * Based on pattern from AddPlantForm.jsx
 */

import React, { useState } from 'react';

const Input = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  autoFocus = false,
  rightIcon,
  style = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: rightIcon ? '18px 50px 18px 18px' : '18px',
          fontSize: '1rem',
          fontFamily: "'Inter', sans-serif",
          color: '#2C2C2C',
          backgroundColor: '#FAFAFA',
          border: 'none',
          borderRadius: '12px',
          outline: 'none',
          boxShadow: isFocused ? 'inset 0 0 0 2px #7CB342' : 'none',
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
    </div>
  );
};

export default Input;
