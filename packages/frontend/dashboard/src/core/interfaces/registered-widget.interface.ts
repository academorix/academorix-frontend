/**
 * @file registered-widget.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Shape of a widget as stored by the framework after
 *   discovery.
 *
 *   The runtime layer needs three related pieces per registered
 *   widget: the raw `@Widget()` metadata (for the picker + auto-
 *   layout), the class reference (for diagnostics in duplicate-key
 *   errors), and a bound renderer function (for the dispatch
 *   component). Grouping them under one interface documents that
 *   they travel together.
 */

import type { Type } from "@stackra/contracts";

import type { IWidgetMetadata } from "./widget-metadata.interface";
import type { IWidgetProvider } from "./widget-provider.interface";
import type { WidgetRenderer } from "@/core/types/widget-renderer.type";

/**
 * A fully-resolved widget entry the framework carries after
 * discovery.
 *
 * The `metadata` block is the shape stamped by the `@Widget()`
 * decorator, `classRef` is the concrete class the container
 * resolved, and `renderer` is a lazily-bound view of
 * `instance.render.bind(instance)`.
 *
 * Consumers should treat this shape as read-only — it's produced by
 * the loader and stored under `WidgetRegistry`. Feature packages
 * never construct one directly; they decorate a class instead.
 */
export interface IRegisteredWidget {
  /** The metadata block `@Widget()` stamped on the class. */
  metadata: IWidgetMetadata;

  /**
   * The concrete widget class the container resolved.
   *
   * Kept as `Type<unknown>` (the workspace's constructor-ref
   * contract from `@stackra/contracts`) rather than the tighter
   * `Type<IWidgetProvider>` so a duplicate-key error can name any
   * class shape without a cast at the throw site. `Type` extends
   * `Function`, so `.name` reads through it.
   */
  classRef: Type<unknown>;

  /**
   * Live provider instance the container resolved. Held so
   * `instance.render(...)` observes the same singleton across every
   * dispatch and so tests can `expect(instance).toBeInstanceOf(...)`.
   */
  instance: IWidgetProvider;

  /**
   * Renderer function bound to `instance.render`. Registered into
   * {@link WidgetRendererRegistry} at the same time so the dispatch
   * component doesn't have to re-thread the instance on every render.
   */
  renderer: WidgetRenderer;
}
