/**
 * @file event-emitter-config-internal.constant.ts
 * @module @stackra/events/core/constants
 * @description Package-internal DI token holding the resolved
 *   `IEventEmitterConfig` value bound by `EventEmitterModule.forRoot`
 *   / `EventEmitterModule.forRootAsync`.
 *
 *   This token is **not** exported from the package's public API
 *   barrel. Consumers reach the config through the app-owned
 *   `eventsConfig.KEY` on a `registerAs(...)` factory from
 *   `@stackra/config` (see the "Config factory" section in
 *   `.kiro/steering/package-conventions.md`), never through this
 *   symbol.
 */

/**
 * Package-internal DI token for `EventEmitterModule`'s resolved
 * config value.
 *
 * Bound by `EventEmitterModule.forRoot` /
 * `EventEmitterModule.forRootAsync` and injected only by classes
 * inside `@stackra/events` — the `EventEmitter` service and any
 * future consumer that needs the merged configuration. Consumers
 * MUST NOT import this token; the canonical way to reach the same
 * config is `@Inject(eventsConfig.KEY)` where `eventsConfig` is
 * an app-owned `registerAs` factory registered via
 * `ConfigModule.forRoot({ load: [eventsConfig] })`.
 *
 * @internal
 */
export const EVENT_EMITTER_CONFIG_INTERNAL = Symbol("@stackra/events:config-internal");
