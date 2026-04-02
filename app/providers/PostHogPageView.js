'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { capture, ensurePostHogInit } from '@/app/lib/analytics/posthog';

export default function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || '';

  useEffect(() => {
    ensurePostHogInit();
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`;
    capture('$pageview', { $current_url: url });
  }, [pathname, search]);

  return null;
}

