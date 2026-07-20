/**
 * @file devtools-tokens.constants.ts
 * @module @stackra/devtools/core/constants
 * @description Package-owned DI tokens.
 *
 *   `DEVTOOLS_REGISTRY`, `DEVTOOLS_INSPECTOR_REGISTRY`, and the two
 *   metadata keys live in `@stackra/contracts` — this file holds
 *   only the tokens the devtools package owns (config value,
 *   frame-state service, analytics bridge).
 */

/** DI token bound to the merged `IDevtoolsModuleOptions`. */
export const DEVTOOLS_CONFIG = Symbol.for('DEVTOOLS_CONFIG');

/** DI token bound to `DevtoolsFrameStateService`. */
export const DEVTOOLS_FRAME_STATE_SERVICE = Symbol.for('DEVTOOLS_FRAME_STATE_SERVICE');

/** DI token bound to `DevtoolsAnalyticsService`. */
export const DEVTOOLS_ANALYTICS_SERVICE = Symbol.for('DEVTOOLS_ANALYTICS_SERVICE');
