'use client';

import { Suspense, useEffect } from 'react';
import { ensurePostHogInit } from '@/app/lib/analytics/posthog';
import PostHogPageView from '@/app/providers/PostHogPageView';

export default function PostHogProvider({ children }) {
  useEffect(() => {
    ensurePostHogInit();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}

