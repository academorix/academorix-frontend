/**
 * @file index.ts
 * @module @stackra/support
 * @description Public API for `@stackra/support` — the canonical
 *   utility library for the `@stackra` monorepo.
 *
 *   Every symbol below is re-exported from a category folder; the
 *   category folders (`chains/`, `errors/`, `interfaces/`, `lifecycle/`,
 *   `managers/`, `mixins/`, `registries/`, `types/`, `utils/`) each
 *   carry their own `index.ts` barrel and match the workspace's
 *   `code-standards.md` layout.
 *
 *   Static utility namespaces (`Str`, `Arr`, `Num`, `Env`, `Uri`,
 *   `Fluent`, `Pipeline`, `HtmlString`, `Benchmark`, `collect`) stay at
 *   the flat root — each file IS its own namespace and the rule's
 *   suffix table has no clearer home for them.
 */

// ════════════════════════════════════════════════════════════════════════
// Static utility namespaces (flat root — one namespace per file)
// ════════════════════════════════════════════════════════════════════════
export { Str } from "./str";
export { Arr } from "./arr";
export { Num } from "./num";
export { Env } from "./env";
export { Uri } from "./uri";
export { Path } from "./path";
export { Fluent } from "./fluent";
export { Pipeline } from "./pipeline";
export { HtmlString } from "./html-string";
export { Benchmark } from "./benchmark";
export { collect } from "./collection";

// ════════════════════════════════════════════════════════════════════════
// Utils — pure stand-alone functions
// ════════════════════════════════════════════════════════════════════════

/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { createDefineConfig } from "./utils";
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils";
export { isBuildTime, once, optional, retry, sleep, tap, timebox } from "./utils";

// TS-level utility types (NestJS-style — types only, no runtime).
export type { PartialType, PickType, OmitType, IntersectionType } from "./utils";

// ════════════════════════════════════════════════════════════════════════
// Chains — priority-ordered pipelines
// ════════════════════════════════════════════════════════════════════════
export { ResolverChain, TransformerChain } from "./chains";

// ════════════════════════════════════════════════════════════════════════
// Registries — abstract key→value storage
// ════════════════════════════════════════════════════════════════════════
export { BaseRegistry } from "./registries";

// ════════════════════════════════════════════════════════════════════════
// Managers — single + multiple-instance driver resolution
// ════════════════════════════════════════════════════════════════════════
export { Manager, MultipleInstanceManager } from "./managers";

// ════════════════════════════════════════════════════════════════════════
// Mixins — class-factory functions + companion standalone classes
// ════════════════════════════════════════════════════════════════════════
export { Conditionable, ConditionableClass } from "./mixins";
export { Macroable, MacroableClass } from "./mixins";

// ════════════════════════════════════════════════════════════════════════
// Lifecycle — framework-lifecycle helpers for `forFeature(...)`
// ════════════════════════════════════════════════════════════════════════
export { createSeedLoader, seedLoaderToken } from "./lifecycle";

// ════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════
export { RegistryDuplicateError, RegistryMissingError } from "./errors";

// ════════════════════════════════════════════════════════════════════════
// Interfaces + types — every package-owned shape lives under these barrels
// ════════════════════════════════════════════════════════════════════════
export type {
  IConditionable,
  IMacroable,
  IMacroableStatic,
  IResolver,
  IRetryOptions,
  ITransformer,
  MacroFunction,
  SeedLoader,
} from "./interfaces";
export type { Constructor, DriverCreator, InstanceCreator } from "./types";
