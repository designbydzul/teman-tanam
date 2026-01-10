'use client';

import React from 'react';

/**
 * TanyaTanamSkeleton
 * Shows skeleton loading state for the Tanya Tanam (AI chat) page
 * Displays placeholder elements while data is loading
 */
const TanyaTanamSkeleton: React.FC = () => {
  return (
    <>
      {/* Main Container */}
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
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'calc(88px + env(safe-area-inset-top, 0px))',
          overflow: 'hidden',
        }}
      >
        {/* Chat Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 24px',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Plant Selector Skeleton */}
          <div
            className="skeleton-pulse"
            style={{
              width: '100%',
              height: '56px',
              backgroundColor: '#E8E8E8',
              borderRadius: '16px',
              marginBottom: '8px',
            }}
          />

          {/* Message Skeletons - Alternating AI (left) and User (right) */}
          {/* AI Message 1 - Welcome message */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              className="skeleton-pulse"
              style={{
                width: '75%',
                height: '80px',
                backgroundColor: '#F0F0F0',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* User Message 1 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              className="skeleton-pulse"
              style={{
                width: '55%',
                height: '48px',
                backgroundColor: '#FFF5D6',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* AI Message 2 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              className="skeleton-pulse"
              style={{
                width: '70%',
                height: '100px',
                backgroundColor: '#F0F0F0',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* User Message 2 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              className="skeleton-pulse"
              style={{
                width: '45%',
                height: '40px',
                backgroundColor: '#FFF5D6',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* AI Message 3 - Longer response */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              className="skeleton-pulse"
              style={{
                width: '80%',
                height: '120px',
                backgroundColor: '#F0F0F0',
                borderRadius: '16px',
              }}
            />
          </div>
        </div>

        {/* Input Area Skeleton - Fixed at bottom */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            padding: '16px 24px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F0F0F0',
            zIndex: 10001,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Camera Button Skeleton */}
            <div
              className="skeleton-pulse"
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#E8E8E8',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />

            {/* Input Field Skeleton */}
            <div
              className="skeleton-pulse"
              style={{
                flex: 1,
                height: '44px',
                backgroundColor: '#F5F5F5',
                borderRadius: '22px',
              }}
            />

            {/* Send Button Skeleton */}
            <div
              className="skeleton-pulse"
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#C5E1A5',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* Header Skeleton - Fixed at top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          zIndex: 10000,
          backgroundColor: '#FFFFFF',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          {/* Back Button Skeleton */}
          <div
            className="skeleton-pulse"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#E8E8E8',
              borderRadius: '50%',
            }}
          />

          {/* Title Skeleton */}
          <div
            className="skeleton-pulse"
            style={{
              width: '120px',
              height: '28px',
              backgroundColor: '#E8E8E8',
              borderRadius: '8px',
            }}
          />

          {/* Search Button Skeleton */}
          <div
            className="skeleton-pulse"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#E8E8E8',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Shimmer Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            #E8E8E8 25%,
            #F5F5F5 50%,
            #E8E8E8 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default TanyaTanamSkeleton;
