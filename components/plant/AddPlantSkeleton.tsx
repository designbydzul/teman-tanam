'use client';

import React from 'react';
import { SkeletonBox, SkeletonCircle } from '@/components/shared/Skeleton';

/**
 * AddPlantSkeleton
 * Skeleton loading state for the Add Plant page (species selection grid)
 */
const AddPlantSkeleton: React.FC = () => {
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
        backgroundColor: '#FFFFFF',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-label="Loading plant species..."
      role="status"
    >
      {/* Header */}
      <div
        style={{
          padding: '24px',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Back Button */}
        <SkeletonCircle size="40px" />

        {/* Title */}
        <SkeletonBox width="140px" height="28px" borderRadius="8px" />

        {/* Spacer for alignment */}
        <div style={{ width: '40px' }} />
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0 24px', marginBottom: '16px' }}>
        <SkeletonBox
          width="100%"
          height="48px"
          borderRadius="24px"
          style={{ backgroundColor: '#F5F5F5' }}
        />
      </div>

      {/* Category Tabs */}
      <div
        style={{
          padding: '0 24px',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'hidden',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBox
            key={i}
            width="70px"
            height="32px"
            borderRadius="16px"
            style={{ flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Species Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          alignContent: 'start',
          paddingBottom: '100px',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
            }}
          >
            {/* Species Image */}
            <SkeletonBox
              width="60px"
              height="60px"
              borderRadius="8px"
            />
            {/* Species Name */}
            <SkeletonBox width="80%" height="14px" borderRadius="4px" />
            {/* Scientific Name */}
            <SkeletonBox width="60%" height="12px" borderRadius="4px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddPlantSkeleton;
