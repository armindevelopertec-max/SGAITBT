'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/state';

export default function AcademicPeriodsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/academic-management');
  }, [router]);
  return <LoadingState />;
}
