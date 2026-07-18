/**
 * @file metadata-keys.constant.ts
 * @module @stackra/events/core/constants
 *
 * @description
 * Legacy re-exports for the events domain metadata keys. The
 * canonical declarations now live in `@stackra/contracts` under the
 * repo-wide `stackra:<domain>:<name>` convention:
 *
 *   * `EVENT_LISTENER_METADATA_KEY`    — from `@OnEvent(...)`
 *   * `EVENT_TRANSPORT_METADATA_KEY`   — from `@EventTransport(...)`
 *   * `EVENT_SUBSCRIBER_METADATA_KEY`  — from `@EventSubscriber(...)`
 *
 * New code should import from `@stackra/contracts` directly. This
 * shim keeps existing imports working during the migration.
 */

export {
  EVENT_LISTENER_METADATA_KEY as EVENT_LISTENER_METADATA,
  EVENT_TRANSPORT_METADATA_KEY as EVENT_TRANSPORT_METADATA,
  EVENT_SUBSCRIBER_METADATA_KEY as EVENT_SUBSCRIBER_METADATA,
} from "@stackra/contracts";

/**
 * DI token for the internal {@link EventTransportRegistry} service —
 * used by the transport auto-discovery loader. Package-scoped: only
 * the events module itself resolves this token.
 *
 * Uses `Symbol.for` (not a plain string) to match every other DI
 * token in the workspace — string tokens defeat the DI framework's
 * token uniqueness guarantees.
 */
export const EVENT_TRANSPORT_REGISTRY_TOKEN = Symbol.for("EVENT_TRANSPORT_REGISTRY_TOKEN");
