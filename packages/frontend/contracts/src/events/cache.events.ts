/**
 * @file cache.events.ts
 * @module @stackra/contracts/events
 * @description Event name constants emitted by `@stackra/cache`.
 *
 *   These events are emitted by `CacheService` on the
 *   `EVENT_EMITTER` bus when an emitter is registered (the service
 *   injects it as `@Optional`, so fail-soft when not configured).
 *
 *   The constants live in contracts because cross-package consumers
 *   (metrics collectors, audit log writers, dashboards) need to
 *   subscribe to these names without depending on `@stackra/cache`
 *   directly.
 *
 *   @example
 *   ```typescript
 *   import { CACHE_EVENTS } from '@stackra/contracts';
 *
 *   @OnEvent(CACHE_EVENTS.MISS)
 *   onCacheMiss(payload: { key: string; store: string }) {
 *     metrics.increment('cache.miss', { store: payload.store });
 *   }
 *   ```
 */

/**
 * Cache lifecycle event names.
 *
 * Payload shapes:
 * - `HIT`         — `{ key, store }`
 * - `MISS`        — `{ key, store }`
 * - `WRITTEN`     — `{ key, store, ttl }`
 * - `FORGOTTEN`   — `{ key, store }`
 * - `FLUSHED`     — `{ store }`
 * - `INCREMENTED` — `{ key, store, by, value }`
 * - `DECREMENTED` — `{ key, store, by, value }`
 * - `TOUCHED`     — `{ key, store, ttl, success }`
 */
export const CACHE_EVENTS = {
  /** A cache key was found (read returned a value). */
  HIT: "cache.hit",
  /** A cache key was requested but not present (or expired). */
  MISS: "cache.miss",
  /** A value was written (set / put / add / forever / setMany). */
  WRITTEN: "cache.written",
  /** A key was removed (delete / forget / pull). */
  FORGOTTEN: "cache.forgotten",
  /** The entire active store was flushed (clear / flush). */
  FLUSHED: "cache.flushed",
  /** A numeric counter was incremented. */
  INCREMENTED: "cache.incremented",
  /** A numeric counter was decremented. */
  DECREMENTED: "cache.decremented",
  /** The TTL of an existing key was extended. */
  TOUCHED: "cache.touched",
} as const;

/**
 * Union type of every emitted cache event name. Use it to constrain
 * listener registrations or event payload maps.
 */
export type CacheEventName = (typeof CACHE_EVENTS)[keyof typeof CACHE_EVENTS];
