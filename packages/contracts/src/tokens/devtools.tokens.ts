/**
 * @file devtools.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens + metadata keys for the devtools subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (every panel
 *   contribution across the workspace) can inject the devtools
 *   registries without pulling in the `@stackra/devtools` runtime.
 *
 *   The metadata keys are consumed by the discovery loader inside
 *   `@stackra/devtools` — feature packages set them via the
 *   `@DevtoolsPanel(...)` / `@DevtoolsInspectorSource(...)`
 *   decorators.
 */

// ════════════════════════════════════════════════════════════════════════════════
// DI tokens
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Token for the `IDevtoolsPanelsRegistry` implementation. Panels are
 * registered against the resolved instance during the container's
 * `onApplicationBootstrap` phase — either by the discovery loader or
 * by a `createSeedLoader` provider dropped in by
 * `DevtoolsModule.forFeature(...)`.
 */
export const DEVTOOLS_REGISTRY = Symbol.for("DEVTOOLS_REGISTRY");

/**
 * Token for the `IDevtoolsInspectorRegistry` implementation. Inspector
 * region sources are registered against the resolved instance during
 * `onApplicationBootstrap`.
 */
export const DEVTOOLS_INSPECTOR_REGISTRY = Symbol.for("DEVTOOLS_INSPECTOR_REGISTRY");

// ════════════════════════════════════════════════════════════════════════════════
// Metadata keys — read by the discovery loader
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Metadata key set by `@DevtoolsPanel(...)`. The discovery loader
 * queries `discovery.getProvidersByMetadata(DEVTOOLS_PANEL_METADATA_KEY)`
 * to enumerate every registered panel at bootstrap.
 */
export const DEVTOOLS_PANEL_METADATA_KEY = Symbol.for("DEVTOOLS_PANEL_METADATA_KEY");

/**
 * Metadata key set by `@DevtoolsInspectorSource(...)`. The discovery
 * loader queries
 * `discovery.getProvidersByMetadata(DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY)`
 * to enumerate every registered inspector source at bootstrap.
 */
export const DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY = Symbol.for(
  "DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY",
);
