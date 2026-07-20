/**
 * @file splash-screen.component.tsx
 * @module @stackra/pwa/react/components
 * @description Fixed-inset splash overlay with a minimum-visible
 *   guard so the splash doesn't flash on fast loads.
 */

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Spinner } from "@stackra/ui/react";

import type { SplashScreenProps } from "./splash-screen.interface";

/**
 * Splash screen.
 *
 * @example
 * ```tsx
 * import { SplashScreen } from '@stackra/pwa/react';
 *
 * function App() {
 *   const [ready, setReady] = useState(false);
 *   useEffect(() => bootstrap().then(() => setReady(true)), []);
 *   return (
 *     <>
 *       <SplashScreen isVisible={!ready} logo={<img src="/logo.svg" width={72} />} />
 *       {ready ? <MainRoutes /> : null}
 *     </>
 *   );
 * }
 * ```
 */
export function SplashScreen({
  isVisible,
  minDurationMs = 800,
  logo,
  message = "Loading...",
  progress,
  className,
}: SplashScreenProps): ReactElement | null {
  // Track the moment the splash was first shown so `minDurationMs`
  // acts as a floor, not a ceiling.
  const mountedAt = useRef<number | null>(null);
  const [shouldRender, setShouldRender] = useState(isVisible);

  // Sync the render state through the min-duration guard.
  useEffect(() => {
    if (isVisible) {
      // First reveal — mark the moment and render immediately.
      if (mountedAt.current == null) mountedAt.current = Date.now();
      setShouldRender(true);
      return;
    }
    // Caller wants to hide. Enforce the floor.
    const start = mountedAt.current ?? Date.now();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minDurationMs - elapsed);
    if (remaining === 0) {
      setShouldRender(false);
      return;
    }
    const handle = setTimeout(() => setShouldRender(false), remaining);
    return () => clearTimeout(handle);
  }, [isVisible, minDurationMs]);

  if (!shouldRender) return null;

  // Determinate progress branch — render a bar. Otherwise the
  // indeterminate spinner. Both variants share the outer overlay.
  const showProgress = typeof progress === "number" && progress >= 0;
  const clamped = showProgress ? Math.min(100, Math.max(0, progress ?? 0)) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background${
        className ? ` ${className}` : ""
      }`}
      data-pwa-splash={showProgress ? "progress" : "default"}
    >
      {logo ? <div className="mb-2">{logo}</div> : null}
      {showProgress ? (
        <div className="flex w-64 flex-col items-center gap-2" aria-label={message}>
          <div className="bg-default-200 h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <span className="text-default-500 text-sm">{message}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" aria-label={message} />
          <span className="text-default-500 text-sm">{message}</span>
        </div>
      )}
    </div>
  );
}
