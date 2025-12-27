'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ResetPassword from '@/components/ResetPassword';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ResetPasswordPage() {
  const router = useRouter();

  const handleNavigate = (view) => {
    if (view === 'login') {
      router.push('/');
    }
  };

  return (
    <ErrorBoundary>
      <ResetPassword onNavigate={handleNavigate} />
    </ErrorBoundary>
  );
}
