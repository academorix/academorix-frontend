/**
 * @file index.ts
 * @module @stackra/events
 * @description Public API for the events package (core entry point).
 *   Lightweight zero-dependency event bus with wildcard matching,
 *   `@OnEvent` auto-discovery, and `@EventTransport` bridging.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { EventEmitterModule } from "./events.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { EventEmitter } from "./services";
export type { EventListener } from "./interfaces/listener-entry.interface";
export { EventTransportRegistry } from "./registries";
export { EventSubscribersLoader } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { OnEvent } from "./decorators";
export { EventTransport } from "./decorators";
export { InjectEventEmitter } from "./decorators";
export { EventSubscriber, EVENT_SUBSCRIBER_METADATA } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { EventEmitterError } from "./errors";
export { EventListenerError } from "./errors";
export { EventTransportError } from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Constants (package-owned only — cross-package tokens live in @stackra/contracts)
// ════════════════════════════════════════════════════════════════════════════════
export {
  EVENT_TRANSPORT_REGISTRY_TOKEN,
  EVENT_LISTENER_METADATA,
  EVENT_TRANSPORT_METADATA,
} from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { IEventEmitterConfig } from "./interfaces";
export type { IOnEventMetadata, IOnEventOptions } from "./interfaces";
export type { IEventTransportOptions, IEventTransport } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Deprecation-shim re-export — lets consumers migrating a single
// file `import { registerAs } from '@stackra/events'` for one release
// cycle without changing the import path. Removed in v0.2; switch
// to `import { registerAs } from '@stackra/config'` at your own
// pace.
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Import `registerAs` directly from `@stackra/config`. Removed in v0.2. */
export { registerAs } from "@stackra/config";
