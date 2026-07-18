/**
 * @file coordinator.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the cross-tab coordinator system.
 *
 *   These tokens live in contracts (not `@stackra/coordinator`) so
 *   consumers can inject the coordinator services without pulling in
 *   the runtime package — pattern matches CACHE_MANAGER, EVENT_EMITTER,
 *   LOGGER_MANAGER.
 */

/** Token for the coordinator module configuration. */
export const COORDINATOR_CONFIG = Symbol.for("COORDINATOR_CONFIG");

/** Token for the TabCoordinator instance (leader election, tab census). */
export const TAB_COORDINATOR = Symbol.for("TAB_COORDINATOR");

/** Token for the cross-tab LockManager (distributed locks). */
export const TAB_LOCK_MANAGER = Symbol.for("TAB_LOCK_MANAGER");

/**
 * Token for the cross-tab transport manager
 * ({@link ITabTransportManager}). Exposes named
 * `BroadcastChannel`-style channels to any package that needs to
 * broadcast between tabs.
 */
export const TAB_TRANSPORT_MANAGER = Symbol.for("TAB_TRANSPORT_MANAGER");
