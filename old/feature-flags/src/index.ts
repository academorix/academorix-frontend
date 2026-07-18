/**
 * @file index.ts
 * @module @academorix/feature-flags
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking; the
 * root exists for convenience.
 *
 * ## Public API
 *
 *  - {@link "@academorix/feature-flags/config"} — `defineFlags<T>()`.
 *  - {@link "@academorix/feature-flags/env"} — `envFlag(key, default)`.
 *  - {@link "@academorix/feature-flags/context"} — `createFeatureFlagsContext<TFlag>()`
 *    → `{ FeatureFlagsProvider, useFeature, useAllFeatures, defaults }`.
 *
 * @example Static declaration + env override
 * ```ts
 * // apps/dashboard/src/config/features.config.ts
 * import { defineFlags, envFlag } from "@academorix/feature-flags";
 *
 * export const featureFlags = defineFlags({
 *   dashboardV2: true,
 *   commandPalette: envFlag("VITE_FLAG_COMMAND_PALETTE", true),
 *   experimentalCharts: envFlag("VITE_FLAG_EXPERIMENTAL_CHARTS", false),
 * });
 *
 * export type FeatureFlag = keyof typeof featureFlags;
 * ```
 *
 * @example Runtime provider + hook
 * ```tsx
 * // apps/dashboard/src/providers.tsx
 * import { createFeatureFlagsContext } from "@academorix/feature-flags/context";
 * import { featureFlags, type FeatureFlag } from "@/config/features.config";
 *
 * export const { FeatureFlagsProvider, useFeature } =
 *   createFeatureFlagsContext<FeatureFlag>(featureFlags);
 *
 * // apps/dashboard/src/components/some-component.tsx
 * function CommandButton() {
 *   const enabled = useFeature("commandPalette");
 *   return enabled ? <Button>Search</Button> : null;
 * }
 * ```
 */

export { defineFlags } from "./config";
export { envFlag } from "./env";
export { createFeatureFlagsContext } from "./context";

export type {
  FeatureFlagsContextBundle,
  FeatureFlagsContextValue,
  FeatureFlagsProviderProps,
} from "./context";
