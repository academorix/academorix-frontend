/**
 * @file actions.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the framework Action layer.
 *
 *   The Action layer routes every side effect (navigate, toast, mutate,
 *   set-state, upload, ...) through one dispatcher + registry, so
 *   authorization, logging, tracing and cancellation land in a single
 *   pipeline.
 */

/** Token for the resolved actions module configuration. */
export const ACTION_CONFIG = Symbol.for("ACTION_CONFIG");

/** Token for the `ActionRegistry` — the name-keyed map of registered handlers. */
export const ACTION_REGISTRY = Symbol.for("ACTION_REGISTRY");

/** Token for the `IActionDispatcher` — the single entry point for every action. */
export const ACTION_DISPATCHER = Symbol.for("ACTION_DISPATCHER");

/**
 * Reflect-metadata key stamped by `@ActionHandler(kind)` on class-shaped
 * handlers so `HandlerDiscoveryService.onApplicationBootstrap` can pick
 * them up.
 */
export const ACTION_HANDLER_METADATA = Symbol.for("ACTION_HANDLER_METADATA");

/**
 * Token for the consumer-supplied `IPermissionResolver` used by the
 * `AuthorizeMiddleware` to gate descriptors carrying a `permission` field.
 */
export const PERMISSION_RESOLVER = Symbol.for("PERMISSION_RESOLVER");
