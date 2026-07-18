/**
 * @file index.ts
 * @module @stackra/events/core/constants
 * @description Barrel export for package-owned event constants.
 *
 *   Contract tokens (`EVENT_EMITTER`) are owned by `@stackra/contracts`
 *   — never re-exported here (see `contract-reexports.md`).
 *
 *   `EVENT_EMITTER_CONFIG_INTERNAL` is intentionally NOT re-exported
 *   by the package's public `src/core/index.ts` barrel — it is a
 *   package-internal binding token consumed only by classes inside
 *   `@stackra/events`. External consumers reach the same config via
 *   `@Inject(eventsConfig.KEY)` on a `registerAs` factory (see
 *   `@stackra/config`).
 *
 *   `DEFAULT_EVENTS_CONFIG` was removed in the `@stackra/config`
 *   migration — defaults now live inline in the app-level
 *   `registerAs` factory. See
 *   `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
 */

export {
  EVENT_LISTENER_METADATA,
  EVENT_TRANSPORT_METADATA,
  EVENT_TRANSPORT_REGISTRY_TOKEN,
} from "./metadata-keys.constant";
export { EVENT_EMITTER_CONFIG_INTERNAL } from "./event-emitter-config-internal.constant";
