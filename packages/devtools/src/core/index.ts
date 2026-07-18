/**
 * @file index.ts
 * @module @stackra/devtools
 * @description Public API for the `@stackra/devtools` core subpath —
 *   DI runtime (module + registries + loaders + config trio +
 *   decorators + services).
 *
 *   The web shell lives under `@stackra/devtools/react`, the native
 *   shell under `@stackra/devtools/native`, and the mocks + factories
 *   under `@stackra/devtools/testing`.
 *
 *   This barrel exports ONLY package-owned symbols. Contract
 *   vocabulary (tokens, contract interfaces, event names, category
 *   union) MUST be imported from `@stackra/contracts` directly per
 *   `.kiro/steering/contract-reexports.md`.
 */

import 'reflect-metadata';

// ════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════
export { DevtoolsModule } from './devtools.module';

// ════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════
export { DevtoolsPanel, DevtoolsInspectorSource } from './decorators';

// ════════════════════════════════════════════════════════════════════
// Registries — concrete classes (contract tokens live in contracts)
// ════════════════════════════════════════════════════════════════════
export { DevtoolsPanelsRegistry, DevtoolsInspectorRegistry } from './registries';

// ════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════
export {
  DevtoolsAnalyticsService,
  DevtoolsFrameStateService,
  DevtoolsInspectorLoaderService,
  DevtoolsPanelsLoaderService,
  type DevtoolsFrameStateListener,
} from './services';

// ════════════════════════════════════════════════════════════════════
// Constants — package-owned only
// ════════════════════════════════════════════════════════════════════
export {
  DEFAULT_DEVTOOLS_CATEGORY_ORDER,
  DEFAULT_DEVTOOLS_CONFIG,
  DEVTOOLS_ANALYTICS_SERVICE,
  DEVTOOLS_CONFIG,
  DEVTOOLS_FRAME_STATE_KEY,
  DEVTOOLS_FRAME_STATE_SERVICE,
  DEVTOOLS_PINNED_PANELS_KEY,
  DEVTOOLS_SIZE_BOUNDS,
} from './constants';

// ════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════
export {
  defineConfig,
  mergeConfig,
  readInspectorSourceMetadata,
  readPanelMetadata,
  shouldEnableDevtools,
} from './utils';

// ════════════════════════════════════════════════════════════════════
// Interfaces + types — package-owned only
// ════════════════════════════════════════════════════════════════════
export type {
  IDevtoolsFrameState,
  IDevtoolsInspectorSourceOptions,
  IDevtoolsModuleAsyncOptions,
  IDevtoolsModuleOptions,
  IDevtoolsPanelOptions,
  IDevtoolsShellProps,
  IDevtoolsShortcut,
} from './interfaces';
export type { DevtoolsShellPosition } from './types';
