/**
 * @file create-feature-flags-context.tsx
 * @module @academorix/feature-flags/context/create-feature-flags-context
 *
 * @description
 * Factory that returns a typed `{ FeatureFlagsProvider, useFeature,
 * useAllFeatures }` bundle bound to an app's concrete flag schema.
 *
 * Why a factory over a package-level context? React's context object
 * carries a default value; a shared context would either need `unknown`
 * everywhere (loses `useFeature("newHome")` autocomplete) or force
 * every app to import from a single schema (defeats app-owned config).
 * The factory gives each app its own strongly-typed provider without
 * duplicating the runtime.
 *
 * ## Runtime overrides
 *
 * The `<FeatureFlagsProvider>` accepts an `overrides` prop that
 * shadow-merges over the static defaults. Use cases:
 *
 *  - **Storybook / tests** — force a specific flag combination.
 *  - **Admin toggle UI** — hydrate from `/auth/me` (per-user flags).
 *  - **Experimentation SDK** — a Growthbook / Vercel Flags integration
 *    resolves the current cohort's flags and passes them here.
 *
 * The provider is memoized on the effective (defaults ∪ overrides)
 * object so downstream consumers only re-render when a flag actually
 * changes.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/lib/feature-flags/context.ts
 * import { createFeatureFlagsContext } from "@academorix/feature-flags/context";
 * import { flags, type FeatureFlag } from "@/config/features.config";
 *
 * export const {
 *   FeatureFlagsProvider,
 *   useFeature,
 *   useAllFeatures,
 * } = createFeatureFlagsContext<FeatureFlag>(flags);
 * ```
 */

import { createContext, useContext, useMemo } from "react";

import type { ReactNode } from "react";

/**
 * Value the provider surfaces through context: the effective flag
 * table (defaults merged with any overrides).
 *
 * @typeParam TFlag - The union of the app's flag keys.
 */
export type FeatureFlagsContextValue<TFlag extends string> = Readonly<Record<TFlag, boolean>>;

/** Props for a schema-bound `FeatureFlagsProvider`. */
export interface FeatureFlagsProviderProps<TFlag extends string> {
  readonly children: ReactNode;
  /**
   * Optional overrides that shadow the static defaults. Missing keys
   * fall through to the defaults. Present-but-`undefined` keys are
   * treated as "no override" so callers can pass partial objects
   * without accidentally disabling flags.
   */
  readonly overrides?: Partial<Record<TFlag, boolean | undefined>>;
}

/**
 * The bundle returned by {@link createFeatureFlagsContext}. Each app
 * instantiates one at boot.
 */
export interface FeatureFlagsContextBundle<TFlag extends string> {
  /** Wrap the app tree; must be above every `useFeature` consumer. */
  readonly FeatureFlagsProvider: (props: FeatureFlagsProviderProps<TFlag>) => ReactNode;
  /** Read a single flag by key. Compile-time-checked against `TFlag`. */
  readonly useFeature: (key: TFlag) => boolean;
  /** Read the entire flag table (all effective values). */
  readonly useAllFeatures: () => FeatureFlagsContextValue<TFlag>;
  /** The static default table (useful for tests + tooling). */
  readonly defaults: FeatureFlagsContextValue<TFlag>;
}

/**
 * Creates a schema-bound provider + hooks pair.
 *
 * @typeParam TFlag - Inferred from the caller's `defaults` keys.
 * @param defaults - The static default flag table (usually from
 *   `defineFlags`).
 * @returns The bound provider, hooks, and defaults handle.
 */
export function createFeatureFlagsContext<TFlag extends string>(
  defaults: Readonly<Record<TFlag, boolean>>,
): FeatureFlagsContextBundle<TFlag> {
  const FeatureFlagsContext = createContext<FeatureFlagsContextValue<TFlag>>(defaults);

  FeatureFlagsContext.displayName = "FeatureFlagsContext";

  function FeatureFlagsProvider({
    children,
    overrides,
  }: FeatureFlagsProviderProps<TFlag>): ReactNode {
    const value = useMemo<FeatureFlagsContextValue<TFlag>>(() => {
      if (!overrides) {
        return defaults;
      }

      // Shallow merge — overrides that are `undefined` fall through to
      // the default, so callers can pass a sparse map safely.
      const merged: Record<string, boolean> = { ...defaults };

      for (const key of Object.keys(overrides) as TFlag[]) {
        const override = overrides[key];

        if (override !== undefined) {
          merged[key] = override;
        }
      }

      return Object.freeze(merged) as FeatureFlagsContextValue<TFlag>;
    }, [overrides]);

    return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
  }

  function useFeature(key: TFlag): boolean {
    return useContext(FeatureFlagsContext)[key];
  }

  function useAllFeatures(): FeatureFlagsContextValue<TFlag> {
    return useContext(FeatureFlagsContext);
  }

  return {
    FeatureFlagsProvider,
    useFeature,
    useAllFeatures,
    defaults,
  };
}
