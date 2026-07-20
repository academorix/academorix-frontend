/**
 * @file widget-metadata-key.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Metadata key stamped by the `@Widget()` decorator via
 *   `@vivtel/metadata`. The {@link WidgetLoader} passes this exact key
 *   to `IDiscoveryService.getProvidersByMetadata(...)` at boot to find
 *   every `@Widget`-decorated class in the container.
 *
 *   Uniform naming with every other discovery consumer in the
 *   workspace (console, cache, events, queue, routing) — the key is
 *   `"stackra:<pkg>:<artefact>"` so a log grep resolves the owner at a
 *   glance.
 */

/**
 * Metadata key for the `@Widget()` class decorator.
 *
 * Stored via `@vivtel/metadata`'s `defineMetadata()` on decorated
 * classes. The {@link WidgetLoader} calls
 * `discovery.getProvidersByMetadata(WIDGET_METADATA_KEY)` during
 * `onApplicationBootstrap` to enumerate every widget contribution.
 */
export const WIDGET_METADATA_KEY = "stackra:dashboard:widget";
