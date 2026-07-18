/**
 * @file widget-registry.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the singleton {@link WidgetRegistry}
 *   — the state store for `@Widget()`-decorated widgets discovered by
 *   {@link WidgetLoader}.
 *
 *   ⚠️ **Breaking rename (v0.2):** in earlier versions this token bound
 *   to `WidgetRegistryService` (the renderer registry). It now binds
 *   to `WidgetRegistry` — the metadata registry — which is the more
 *   useful anchor for downstream consumers. The renderer registry
 *   has its own dedicated token {@link WIDGET_RENDERER_REGISTRY}.
 */

/**
 * Symbol token for the singleton {@link WidgetRegistry}.
 */
export const WIDGET_REGISTRY: unique symbol = Symbol.for("@stackra/dashboard/WIDGET_REGISTRY");
