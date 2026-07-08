/**
 * @file use-surface.ts
 * @module onboarding/use-surface
 *
 * @description
 * React hook that returns the {@link OnboardingSurface} the user landed
 * on. The value is computed exactly once per session — the surface is a
 * boot-time fact that can never change while the tab is alive:
 *
 * - The user cannot install the app mid-session.
 * - The user cannot switch from the desktop shell to a browser tab.
 * - The URL's `?source=…` marker is stripped by the tour system on
 *   first read, so subsequent renders would see a "web" URL — but we've
 *   already cached the truthful value from the first pass.
 *
 * Caching lives in module scope so *every* consumer sees the same
 * surface regardless of when they mount. This matters because the tour
 * provider mounts high in the tree and the checklist widget mounts deep
 * — they'd otherwise disagree on the surface.
 *
 * The hook returns a stable string reference across renders so React's
 * dependency-array comparators (in `useEffect`, `useMemo`) don't spin
 * unnecessarily.
 *
 * @see onboarding module — Surface detection contract.
 */

import { useSyncExternalStore } from "react";

import type { OnboardingSurface } from "@/config/onboarding.config";

import { detectSurface, readSurfaceInput } from "@/lib/onboarding/detect-surface";

/**
 * Session-scoped memo. Populated on the first invocation of
 * {@link useSurface} (or {@link resolveSurface}); reset only by
 * {@link __resetSurfaceForTests} which lives behind a `__` prefix so
 * production consumers cannot accidentally invalidate the cache.
 */
let cachedSurface: OnboardingSurface | null = null;

/**
 * Synchronously resolve the current surface. Prefer {@link useSurface}
 * inside React components; this exists for non-React consumers (the
 * analytics dispatcher, the cloud-state sync loop) that need the value
 * before they render anything.
 *
 * Returns the same string reference on every call.
 */
export function resolveSurface(): OnboardingSurface {
  if (cachedSurface === null) {
    cachedSurface = detectSurface(readSurfaceInput());
  }

  return cachedSurface;
}

/**
 * React hook wrapping {@link resolveSurface}. Uses
 * `useSyncExternalStore` (rather than `useMemo` or `useState`) so the
 * cached value survives React 18's StrictMode double-render + concurrent
 * tearing — the hook returns the exact same object identity across
 * every render in every subscribed component.
 *
 * @returns The active onboarding surface. Never throws.
 *
 * @example
 * ```tsx
 * function TourGate() {
 *   const surface = useSurface();
 *
 *   if (surface === "pwa") {
 *     // Show PWA preface step 0.
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useSurface(): OnboardingSurface {
  // `subscribe` returns a no-op unsubscribe — the surface never changes
  // during a session, so there are no updates to broadcast.
  return useSyncExternalStore(subscribe, resolveSurface, resolveSurface);
}

/** Store subscription — never fires because the surface is immutable. */
function subscribe(): () => void {
  return () => {};
}

/**
 * Test-only helper: clears the module-scoped cache so a subsequent
 * `resolveSurface()` re-detects. Named with a `__` prefix to signal
 * that production code MUST NOT call it.
 *
 * @internal
 */
export function __resetSurfaceForTests(): void {
  cachedSurface = null;
}
