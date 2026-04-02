'use client';

import posthog from 'posthog-js';

let initialized = false;

export function isPostHogEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function ensurePostHogInit() {
  if (initialized) return;
  if (!isPostHogEnabled()) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // App Router needs manual pageview capture
    autocapture: true,
  });

  initialized = true;
}

export function capture(event, properties) {
  if (!isPostHogEnabled()) return;
  ensurePostHogInit();
  posthog.capture(event, properties);
}

/** Call after capture() when the page may be unloading so the event is sent immediately. */
export function flush() {
  if (!isPostHogEnabled()) return;
  ensurePostHogInit();
  if (typeof posthog.flush === 'function') posthog.flush();
}

export function identify(distinctId, properties) {
  if (!isPostHogEnabled()) return;
  ensurePostHogInit();
  posthog.identify(String(distinctId), properties);
}

export function reset() {
  if (!isPostHogEnabled()) return;
  ensurePostHogInit();
  posthog.reset();
}

export function setPersonProperties(properties) {
  if (!isPostHogEnabled()) return;
  ensurePostHogInit();
  posthog.setPersonProperties(properties);
}

