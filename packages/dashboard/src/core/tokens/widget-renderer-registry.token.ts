/**
 * @file widget-renderer-registry.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the singleton
 *   {@link WidgetRendererRegistry} — the key → {@link WidgetRenderer}
 *   dispatch map.
 *
 *   Renamed from the legacy `WIDGET_REGISTRY` token (which now binds
 *   to the metadata registry). Consumers that used to inject the
 *   renderer registry via `WIDGET_REGISTRY` should migrate to this
 *   token in the same commit that upgrades `@stackra/dashboard`.
 */

/**
 * Symbol token for the singleton {@link WidgetRendererRegistry}.
 */
export const WIDGET_RENDERER_REGISTRY: unique symbol = Symbol.for(
  "@stackra/dashboard/WIDGET_RENDERER_REGISTRY",
);
