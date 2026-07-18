/**
 * @file create-analytics-context.tsx
 * @module @academorix/analytics/context/create-analytics-context
 *
 * @description
 * Factory that returns a typed `{ AnalyticsProvider, useAnalytics }`
 * pair bound to an app's concrete event registry.
 *
 * The provider takes a list of adapters and fan-outs every call. The
 * hook returns three methods (`track`, `identify`, `page`) plus a
 * `reset` for logout. `track`'s first arg is typed to the app's
 * event union so misspellings fail at compile time.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/lib/analytics/context.ts
 * import { createAnalyticsContext } from "@academorix/analytics/context";
 * import { EVENTS, type AnalyticsEvent } from "@/config/analytics.config";
 *
 * export const { AnalyticsProvider, useAnalytics } =
 *   createAnalyticsContext<AnalyticsEvent>();
 *
 * // apps/dashboard/src/providers.tsx
 * import { vercelAnalyticsAdapter } from "@academorix/analytics/adapters/vercel";
 * import { posthogAnalyticsAdapter } from "@academorix/analytics/adapters/posthog";
 *
 * <AnalyticsProvider adapters={[vercelAnalyticsAdapter, posthogAnalyticsAdapter]}>
 *   {children}
 * </AnalyticsProvider>
 *
 * // apps/dashboard/src/some-component.tsx
 * const { track } = useAnalytics();
 * track(EVENTS.athleteCreated, { branchId, tenantId });
 * ```
 */

import { createContext, useCallback, useContext, useMemo } from "react";

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "../adapters/analytics-adapter.type";
import type { ReactNode } from "react";

/** Value the provider surfaces through context. */
export interface AnalyticsContextValue<TEvent extends string> {
  /** Record a custom event. `name` is compile-time-checked against `TEvent`. */
  readonly track: (name: TEvent, properties?: AnalyticsProperties) => void;
  /** Associate the current session with a user + traits. */
  readonly identify: (identity: AnalyticsIdentity) => void;
  /** Record a page-view. Called by the router integration on route change. */
  readonly page: (view: AnalyticsPageView) => void;
  /** Clear the session — usually on logout. */
  readonly reset: () => void;
}

/** Props for an event-bound `AnalyticsProvider`. */
export interface AnalyticsProviderProps {
  readonly children: ReactNode;
  /**
   * The adapters to fan-out to. Passing an empty array disables
   * analytics (useful for dev / SSR / tests). Order determines
   * fan-out order but shouldn't affect correctness.
   */
  readonly adapters: readonly AnalyticsAdapter[];
}

/** The bundle returned by {@link createAnalyticsContext}. */
export interface AnalyticsContextBundle<TEvent extends string> {
  /** Wrap the app tree; must be above every `useAnalytics` consumer. */
  readonly AnalyticsProvider: (props: AnalyticsProviderProps) => ReactNode;
  /** Read the analytics dispatchers from context. */
  readonly useAnalytics: () => AnalyticsContextValue<TEvent>;
}

/**
 * Safely invokes an adapter method — catches sync throws so a broken
 * adapter never breaks the fan-out. Async failures are the adapter's
 * responsibility to log.
 */
function safeInvoke(label: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[@academorix/analytics] Adapter ${label} threw:`, error);
  }
}

/**
 * Creates an event-registry-bound provider + hook. Callers pass the
 * app's event union as the generic; the returned `track` narrows to it.
 *
 * @typeParam TEvent - The union of the app's tracked event names.
 */
export function createAnalyticsContext<TEvent extends string>(): AnalyticsContextBundle<TEvent> {
  const AnalyticsContext = createContext<AnalyticsContextValue<TEvent> | null>(null);

  AnalyticsContext.displayName = "AnalyticsContext";

  function AnalyticsProvider({ children, adapters }: AnalyticsProviderProps): ReactNode {
    const track = useCallback(
      (name: TEvent, properties?: AnalyticsProperties) => {
        for (const adapter of adapters) {
          safeInvoke(`${adapter.name}.track`, () => adapter.track(name, properties));
        }
      },
      [adapters],
    );

    const identify = useCallback(
      (identity: AnalyticsIdentity) => {
        for (const adapter of adapters) {
          safeInvoke(`${adapter.name}.identify`, () => adapter.identify(identity));
        }
      },
      [adapters],
    );

    const page = useCallback(
      (view: AnalyticsPageView) => {
        for (const adapter of adapters) {
          safeInvoke(`${adapter.name}.page`, () => adapter.page(view));
        }
      },
      [adapters],
    );

    const reset = useCallback(() => {
      for (const adapter of adapters) {
        safeInvoke(`${adapter.name}.reset`, () => adapter.reset?.());
      }
    }, [adapters]);

    const value = useMemo<AnalyticsContextValue<TEvent>>(
      () => ({ track, identify, page, reset }),
      [track, identify, page, reset],
    );

    return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
  }

  function useAnalytics(): AnalyticsContextValue<TEvent> {
    const value = useContext(AnalyticsContext);

    if (!value) {
      throw new Error(
        "useAnalytics must be used within an <AnalyticsProvider>. " +
          "Make sure the provider is mounted above the component tree.",
      );
    }

    return value;
  }

  return { AnalyticsProvider, useAnalytics };
}
