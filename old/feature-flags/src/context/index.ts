/**
 * @file index.ts
 * @module @academorix/feature-flags/context
 *
 * @description
 * Public barrel for the runtime React layer — the factory that
 * produces a schema-bound {FeatureFlagsProvider, useFeature,
 * useAllFeatures} bundle for a concrete app.
 */

export { createFeatureFlagsContext } from "./create-feature-flags-context";
export type {
  FeatureFlagsContextBundle,
  FeatureFlagsContextValue,
  FeatureFlagsProviderProps,
} from "./create-feature-flags-context";
