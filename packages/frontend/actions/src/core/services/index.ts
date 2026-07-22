/**
 * @file index.ts
 * @module @stackra/actions/core/services
 * @description Public API barrel for the `services` category — re-exports the
 *   dispatcher entry point (`ActionDispatcherService`) and the
 *   `HandlerLoader` that scans the DI graph for `@ActionHandler`-decorated
 *   providers at bootstrap.
 */

export { ActionDispatcherService } from "./action-dispatcher.service";
export { HandlerLoader } from "./handler-loader.service";
