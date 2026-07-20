/**
 * @file use-wake-lock.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Wrapper around `navigator.wakeLock.request('screen')`.
 *
 *   The screen wake lock keeps the display from turning off — useful
 *   for a video call UI, a recipe screen, or a fitness timer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Value returned by {@link useWakeLock}.
 */
export interface IUseWakeLockResult {
  /** Whether the Wake Lock API is available. */
  readonly isSupported: boolean;
  /** Whether the lock is currently held. */
  readonly isActive: boolean;
  /** Acquire the lock. Returns `true` on success. */
  readonly request: () => Promise<boolean>;
  /** Release the lock. */
  readonly release: () => Promise<void>;
}

/**
 * Screen wake-lock hook.
 *
 * The lock is auto-released when the page is hidden (browsers do this
 * unconditionally). Consumers can re-request it in the
 * `visibilitychange` handler if they want the lock to survive
 * background transitions.
 *
 * @example
 * ```tsx
 * import { useWakeLock } from '@stackra/pwa/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function StayAwakeToggle() {
 *   const { isActive, isSupported, request, release } = useWakeLock();
 *   if (!isSupported) return null;
 *   return (
 *     <Button onPress={() => (isActive ? release() : request())}>
 *       {isActive ? 'Sleep OK' : 'Stay awake'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useWakeLock(): IUseWakeLockResult {
  const isSupported = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      // `wakeLock` isn't in the standard lib.dom types yet — check
      // via a structural cast.
      typeof (navigator as unknown as { wakeLock?: unknown }).wakeLock === "object",
    [],
  );

  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<{ release: () => Promise<void> } | null>(null);

  const request = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      // Cast to any-shaped wakeLock — the standard lib types lag.
      const sentinel = await (
        navigator as unknown as {
          wakeLock: { request(type: "screen"): Promise<{ release: () => Promise<void> }> };
        }
      ).wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setIsActive(true);
      return true;
    } catch {
      // fail-soft — most errors are policy-based (page not focused).
      setIsActive(false);
      return false;
    }
  }, [isSupported]);

  const release = useCallback(async (): Promise<void> => {
    try {
      await sentinelRef.current?.release();
    } catch {
      // fail-soft — sentinel may be stale after the browser released
      // it on visibility change.
    }
    sentinelRef.current = null;
    setIsActive(false);
  }, []);

  useEffect(() => {
    // Auto-release on unmount so we don't hold the lock past the
    // hook's lifetime.
    return () => {
      void release();
    };
  }, [release]);

  return { isSupported, isActive, request, release };
}
