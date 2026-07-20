/**
 * @file use-safe-area-insets.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Read `env(safe-area-inset-*)` values through a hidden
 *   probe element.
 *
 *   The browser doesn't expose safe-area insets through
 *   `matchMedia`, so we mount a fixed-position probe with each edge
 *   padded by the corresponding `env(safe-area-inset-*)` and read
 *   the resulting `padding-*` values off `getComputedStyle`.
 */

import { useEffect, useState } from "react";

import type { IUseSafeAreaInsetsResult } from "./use-safe-area-insets.interface";

/** Parse a `Npx` string returned by `getComputedStyle`. */
function parsePx(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Read the four safe-area insets in pixels.
 *
 * The values are re-measured on `resize` and `orientationchange`
 * events (both fire on device rotation).
 *
 * @example
 * ```tsx
 * import { useSafeAreaInsets } from '@stackra/pwa/react';
 *
 * function StatusBar() {
 *   const { top } = useSafeAreaInsets();
 *   return <div style={{ paddingTop: top }}>Toolbar</div>;
 * }
 * ```
 */
export function useSafeAreaInsets(): IUseSafeAreaInsetsResult {
  const [insets, setInsets] = useState<IUseSafeAreaInsetsResult>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    // SSR guard.
    if (typeof document === "undefined" || typeof window === "undefined") return;

    // Probe element — fixed-position + `env(safe-area-inset-*)`
    // padding gives us the four insets in a single style read.
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.pointerEvents = "none";
    probe.style.top = "0";
    probe.style.left = "0";
    probe.style.width = "0";
    probe.style.height = "0";
    // The `env()` fallback of `0px` keeps browsers without safe-area
    // support from producing NaN.
    probe.style.paddingTop = "env(safe-area-inset-top, 0px)";
    probe.style.paddingRight = "env(safe-area-inset-right, 0px)";
    probe.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
    probe.style.paddingLeft = "env(safe-area-inset-left, 0px)";
    document.body.appendChild(probe);

    const measure = (): void => {
      const cs = window.getComputedStyle(probe);
      setInsets({
        top: parsePx(cs.paddingTop),
        right: parsePx(cs.paddingRight),
        bottom: parsePx(cs.paddingBottom),
        left: parsePx(cs.paddingLeft),
      });
    };
    measure();

    // Rotation / resize both change the safe-area extent.
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      probe.remove();
    };
  }, []);

  return insets;
}
