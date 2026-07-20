/**
 * @file config-change-event.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Payload dispatched when a configuration value mutates
 *   via `ConfigService.set(path, value)`.
 *
 *   Ships in v0.1 as a type-only stub — the `changes$` observable
 *   stream that consumes this shape is a v0.2 add-back. Shipping the
 *   interface now so v0.2 does not require a contracts bump.
 *
 * @derived @nestjs/config@4.0.4 — lib/interfaces/config-change-event.interface.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Configuration mutation event.
 *
 * Dispatched by `ConfigService` when a caller mutates a value through
 * `ConfigService.set(path, value)`. The `changes$` stream that emits
 * these events is deferred to v0.2 — this shape ships now so contract
 * consumers can type-check subscribers ahead of the runtime landing.
 *
 * @typeParam OldValue - Type of the previous value at `path`.
 * @typeParam NewValue - Type of the new value written at `path`.
 * @publicApi
 */
export interface IConfigChangeEvent<OldValue = unknown, NewValue = unknown> {
  /** Dotted property path that was mutated (e.g. `'database.host'`). */
  path: string;

  /** The value at `path` before `ConfigService.set` was called. */
  oldValue: OldValue;

  /** The value at `path` after `ConfigService.set` was called. */
  newValue: NewValue;
}
