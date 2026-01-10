'use client';

import React from 'react';
import { SkeletonBox, SkeletonCircle } from '@/components/shared/Skeleton';

/**
 * LocationSettingsSkeleton
 * Skeleton loading state for the Location Settings page
 */
const LocationSettingsSkeleton: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--app-max-width)',
        height: '100vh',
        backgroundColor: '#F5F5F5',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-label="Loading locations..."
      role="status"
    >
      {/* Header */}
      <div
        style={{
          padding: '24px',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        {/* Back Button */}
        <SkeletonCircle size="40px" />

        {/* Title */}
        <SkeletonBox width="100px" height="24px" borderRadius="8px" />

        {/* Spacer */}
        <div style={{ width: '40px' }} />
      </div>

      {/* Location List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Drag Handle */}
            <SkeletonBox width="20px" height="24px" borderRadius="4px" />

            {/* Location Icon */}
            <SkeletonCircle size="40px" />

            {/* Location Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SkeletonBox width="100px" height="16px" borderRadius="4px" />
              <SkeletonBox width="60px" height="12px" borderRadius="4px" />
            </div>

            {/* Delete Button */}
            <SkeletonCircle size="36px" />
          </div>
        ))}
      </div>

      {/* Add Location Button */}
      <div
        style={{
          padding: '16px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
        }}
      >
        <SkeletonBox
          width="100%"
          height="48px"
          borderRadius="12px"
          style={{ backgroundColor: '#C5E1A5' }}
        />
      </div>
    </div>
  );
};

export default LocationSettingsSkeleton;
