'use client';

import React from 'react';
import { SkeletonBox, SkeletonCircle } from '@/components/shared/Skeleton';

/**
 * PlantDetailSkeleton
 * Skeleton loading state for the Plant Detail page
 */
const PlantDetailSkeleton: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
      }}
      aria-label="Loading plant details..."
      role="status"
    >
      {/* Header with Back Button, Plant Image, Settings */}
      <div
        style={{
          padding: '24px 16px 16px',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Back Button */}
        <SkeletonCircle size="40px" />

        {/* Center Plant Image */}
        <SkeletonBox
          width="120px"
          height="120px"
          borderRadius="16px"
        />

        {/* Settings Button */}
        <SkeletonCircle size="40px" />
      </div>

      {/* Plant Info - Centered */}
      <div style={{ padding: '0 16px', textAlign: 'center', marginBottom: '16px' }}>
        {/* Plant Name */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <SkeletonBox width="180px" height="28px" borderRadius="8px" />
        </div>

        {/* Metadata Row */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SkeletonBox width="200px" height="16px" borderRadius="4px" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          margin: '0 16px',
          backgroundColor: '#F5F5F5',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '16px',
        }}
      >
        <SkeletonBox width="50%" height="40px" borderRadius="8px" style={{ backgroundColor: '#E8E8E8' }} />
        <SkeletonBox width="50%" height="40px" borderRadius="8px" style={{ backgroundColor: 'transparent' }} />
      </div>

      {/* Quick Action Cards */}
      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                backgroundColor: '#FAFAFA',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Icon */}
              <SkeletonCircle size="40px" />
              {/* Label */}
              <SkeletonBox width="60px" height="14px" borderRadius="4px" />
              {/* Status */}
              <SkeletonBox width="80px" height="12px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      {/* Other Action Button */}
      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <SkeletonBox width="100%" height="48px" borderRadius="12px" />
      </div>

      {/* History Section Title */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <SkeletonBox width="120px" height="20px" borderRadius="4px" />
      </div>

      {/* History Timeline */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
            }}
          >
            {/* Icon */}
            <SkeletonCircle size="36px" />

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SkeletonBox width="100px" height="16px" borderRadius="4px" />
              <SkeletonBox width="60%" height="14px" borderRadius="4px" />
            </div>

            {/* Time */}
            <SkeletonBox width="50px" height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Bottom Tanya Tanam Card Skeleton */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          left: '16px',
          right: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E4E4E7',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SkeletonBox width="100px" height="16px" borderRadius="4px" />
          <SkeletonBox width="140px" height="14px" borderRadius="4px" />
        </div>
        <SkeletonCircle size="40px" />
      </div>
    </div>
  );
};

export default PlantDetailSkeleton;
