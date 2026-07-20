/**
 * @file splash-screen.interface.ts
 * @module @stackra/pwa/react/components
 * @description Props for the `<SplashScreen>` component.
 */

import type { ReactNode } from "react";

/**
 * Props accepted by {@link SplashScreen}.
 */
export interface SplashScreenProps {
  /**
   * Whether the splash should render. Consumers typically wire this
   * to their app-ready flag.
   */
  readonly isVisible: boolean;
  /**
   * Minimum wall-clock time (ms) the splash stays visible even if
   * `isVisible` flips to `false` earlier. Prevents flash-of-splash on
   * fast loads.
   *
   * @default 800
   */
  readonly minDurationMs?: number;
  /**
   * Optional logo rendered above the spinner — anything the caller
   * would put on an SSR-safe placeholder works (an `<img>`, an
   * inline SVG, a Tailwind-styled `<div>`).
   */
  readonly logo?: ReactNode;
  /** Body text below the logo. @default 'Loading...' */
  readonly message?: string;
  /**
   * When present, replaces the indeterminate spinner with a
   * determinate percent progress rendered inline. Values from 0 to
   * 100.
   */
  readonly progress?: number;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
