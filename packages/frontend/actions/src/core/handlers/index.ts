/**
 * @file index.ts
 * @module @stackra/actions/core/handlers
 * @description Public API barrel for the `handlers` category — re-exports the
 *   composite and dispatch handler classes that wrap and invoke registered
 *   action handlers.
 */

export { CompositeHandler } from "./composite.handler";
export { DispatchHandler } from "./dispatch.handler";
