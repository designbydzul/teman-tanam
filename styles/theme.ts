/**
 * Teman Tanam Design Tokens
 *
 * TypeScript exports of design tokens for use in JavaScript/TypeScript components.
 * These values mirror the CSS custom properties in tokens.css.
 */

/* ==================== COLORS ==================== */

export const colors = {
  // Primary Colors
  greenFresh: '#7CB342',
  greenForest: '#2D5016',
  brownEarth: '#8B4513',
  blueSky: '#87CEEB',
  yellowSun: '#FFD54F',

  // Neutral Colors
  cream: '#F5F5DC',
  white: '#FFFFFF',
  gray100: '#FAFAFA',
  gray200: '#E0E0E0',
  gray400: '#BDBDBD',
  gray600: '#757575',
  gray800: '#2C2C2C',

  // Semantic Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
} as const;

/* ==================== TYPOGRAPHY ==================== */

export const typography = {
  // Font Family
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyAccent: "'Caveat', cursive",

  // Font Sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/* ==================== SPACING ==================== */

export const spacing = {
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
} as const;

/* ==================== BORDER RADIUS ==================== */

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

/* ==================== SHADOWS ==================== */

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.12)',
  xl: '0 8px 32px rgba(0, 0, 0, 0.15)',
} as const;

/* ==================== TRANSITIONS ==================== */

export const transitions = {
  fast: '100ms',
  base: '200ms',
  slow: '300ms',
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
} as const;

/* ==================== THEME OBJECT ==================== */

/**
 * Complete theme object containing all design tokens
 */
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
} as const;

export default theme;
