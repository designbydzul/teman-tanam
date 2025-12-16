'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Error info:', errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#F5F5F5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              🌱
            </div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '8px',
              }}
            >
              Terjadi Kesalahan
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              Maaf, ada yang tidak beres. Silakan coba lagi atau refresh halaman.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    color: '#DC2626',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4A7C59',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Coba Lagi
              </button>
              <button
                onClick={this.handleRefresh}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#4A7C59',
                  border: '1px solid #4A7C59',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
