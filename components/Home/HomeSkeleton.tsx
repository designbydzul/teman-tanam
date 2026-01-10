'use client';

import React from 'react';
import { SkeletonBox, SkeletonCircle } from '@/components/shared/Skeleton';

/**
 * HomeSkeleton
 * Skeleton loading state for the Home page
 * Shows placeholder for stats cards and plant grid
 */
const HomeSkeleton: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
      }}
      aria-label="Loading home page..."
      role="status"
    >
      {/* Header Skeleton */}
      <div
        style={{
          padding: '24px',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo/Title area */}
        <SkeletonBox width="140px" height="32px" borderRadius="8px" />

        {/* Profile avatar */}
        <SkeletonCircle size="40px" />
      </div>

      {/* Search Bar Skeleton */}
      <div style={{ padding: '0 24px', marginBottom: '16px' }}>
        <SkeletonBox width="100%" height="48px" borderRadius="12px" style={{ backgroundColor: '#F5F5F5' }} />
      </div>

      {/* Location Filter Skeleton */}
      <div
        style={{
          padding: '0 24px',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'hidden',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox
            key={i}
            width="80px"
            height="36px"
            borderRadius="18px"
            style={{ flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Stats Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '0 24px',
          marginBottom: '16px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* Label */}
            <SkeletonBox width="70%" height="12px" />
            {/* Value row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="40px" height="24px" />
              <SkeletonCircle size="20px" />
            </div>
          </div>
        ))}
      </div>

      {/* Plant Grid Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px 12px',
          padding: '16px 24px',
          paddingBottom: '100px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Plant Image */}
            <SkeletonBox
              width="100%"
              height="auto"
              borderRadius="16px"
              style={{ aspectRatio: '1', marginBottom: '8px' }}
            />
            {/* Plant Name */}
            <SkeletonBox width="80%" height="16px" borderRadius="4px" style={{ marginBottom: '4px' }} />
            {/* Plant Status */}
            <SkeletonBox width="60%" height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeSkeleton;
