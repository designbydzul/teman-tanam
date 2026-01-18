'use client';

import React from 'react';

/**
 * Skeleton Loading Components
 * Reusable skeleton primitives for consistent loading states across the app
 */

// Base skeleton styles
const baseStyle: React.CSSProperties = {
  backgroundColor: '#E0E0E0',
  borderRadius: '8px',
};

// Shimmer animation keyframes (defined in globals.css as skeleton-pulse)
// Uses the existing skeleton-pulse class for animation

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * SkeletonBox - Basic rectangular skeleton
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  style,
  className = '',
}) => (
  <div
    className={`skeleton-pulse ${className}`}
    style={{
      ...baseStyle,
      width,
      height,
      borderRadius,
      ...style,
    }}
    aria-label="Loading..."
    role="status"
  />
);

/**
 * SkeletonText - Text line skeleton with variants
 */
interface SkeletonTextProps extends SkeletonProps {
  variant?: 'heading' | 'body' | 'caption';
  lines?: number;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  variant = 'body',
  lines = 1,
  lastLineWidth = '70%',
  width = '100%',
  style,
  className = '',
}) => {
  const heights = {
    heading: '24px',
    body: '16px',
    caption: '12px',
  };

  const height = heights[variant];

  if (lines === 1) {
    return (
      <SkeletonBox
        width={width}
        height={height}
        borderRadius="8px"
        style={style}
        className={className}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 ? lastLineWidth : width}
          height={height}
          borderRadius="8px"
          className={className}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCircle - Circular skeleton for avatars, icons
 */
interface SkeletonCircleProps extends SkeletonProps {
  size?: string | number;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = '40px',
  style,
  className = '',
}) => (
  <SkeletonBox
    width={size}
    height={size}
    borderRadius="50%"
    style={{ flexShrink: 0, ...style }}
    className={className}
  />
);

/**
 * SkeletonButton - Button-shaped skeleton
 */
interface SkeletonButtonProps extends SkeletonProps {
  variant?: 'primary' | 'secondary' | 'icon';
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  variant = 'primary',
  width,
  height,
  style,
  className = '',
}) => {
  const sizes = {
    primary: { width: width || '120px', height: height || '44px', borderRadius: '12px' },
    secondary: { width: width || '100px', height: height || '36px', borderRadius: '8px' },
    icon: { width: width || '44px', height: height || '44px', borderRadius: '50%' },
  };

  const config = sizes[variant];

  return (
    <SkeletonBox
      width={config.width}
      height={config.height}
      borderRadius={config.borderRadius}
      style={style}
      className={className}
    />
  );
};

/**
 * SkeletonImage - Image placeholder skeleton
 */
interface SkeletonImageProps extends SkeletonProps {
  aspectRatio?: string;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height,
  aspectRatio = '1',
  borderRadius = '12px',
  style,
  className = '',
}) => (
  <SkeletonBox
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={{ aspectRatio, ...style }}
    className={className}
  />
);

/**
 * SkeletonCard - Card container with skeleton content
 */
interface SkeletonCardProps {
  children?: React.ReactNode;
  padding?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  children,
  padding = '16px',
  borderRadius = '12px',
  style,
  className = '',
}) => (
  <div
    className={className}
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius,
      padding,
      border: '1px solid #F0F0F0',
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * SkeletonInput - Input field skeleton
 */
export const SkeletonInput: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '48px',
  borderRadius = '12px',
  style,
  className = '',
}) => (
  <SkeletonBox
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={{ backgroundColor: '#F5F5F5', ...style }}
    className={className}
  />
);

/**
 * SkeletonContainer - Wrapper with loading state
 */
interface SkeletonContainerProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const SkeletonContainer: React.FC<SkeletonContainerProps> = ({
  isLoading,
  skeleton,
  children,
}) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
};

// Default export for convenience
const Skeleton = {
  Box: SkeletonBox,
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Button: SkeletonButton,
  Image: SkeletonImage,
  Card: SkeletonCard,
  Input: SkeletonInput,
  Container: SkeletonContainer,
};

export default Skeleton;
