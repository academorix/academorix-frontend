/**
 * @file index.ts
 * @module @stackra/scope/core/services
 * @description Public API barrel for the core `services` category —
 *   re-exports the `ScopeService` (holds the active scope and notifies
 *   subscribers) and its `ScopeListener` callback type.
 */

export { ScopeService, type ScopeListener } from "./scope.service";
