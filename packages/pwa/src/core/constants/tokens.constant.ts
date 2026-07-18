/**
 * @file tokens.constant.ts
 * @module @stackra/pwa/core/constants
 * @description DI tokens for the PWA runtime.
 *
 *   All tokens are owned by this package — none are re-exported from
 *   `@stackra/contracts`, per the workspace's contract-reexports rule.
 *   Consumers inject these tokens directly from `@stackra/pwa`.
 *
 *   Analytics fan-out is now bound directly against `ANALYTICS_MANAGER`
 *   from `@stackra/contracts` — no dedicated bridge-client token
 *   (previously `PWA_ANALYTICS_BRIDGE`) is needed. The
 *   {@link AnalyticsBridgeService} wraps the manager with fail-soft
 *   semantics for consumers who don't ship `@stackra/analytics`.
 */

/** DI token for the merged {@link IPwaModuleOptions}. */
export const PWA_CONFIG = Symbol.for('PWA_CONFIG');

/** DI token for the {@link PwaService} singleton. */
export const PWA_SERVICE = Symbol.for('PWA_SERVICE');

/**
 * DI token for the {@link AppUpdateService} — backend-published app
 * release polling + realtime subscription.
 *
 * Only bound when `PwaModule.forRoot({ appUpdate: {...} })` is
 * called; consumers who don't configure app updates never see this
 * token registered.
 */
export const APP_UPDATE_SERVICE = Symbol.for('APP_UPDATE_SERVICE');
