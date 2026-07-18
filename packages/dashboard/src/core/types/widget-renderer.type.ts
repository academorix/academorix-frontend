/**
 * @file widget-renderer.type.ts
 * @module @stackra/dashboard/core/types
 * @description The React function-component signature every widget
 *   renderer conforms to. Kept as a plain function type (not a full
 *   component) so registrars can pass either a component reference or
 *   an inline factory.
 */

import type { ReactNode } from "react";

import type { IWidgetRendererContext } from "@/core/interfaces/widget-renderer-context.interface";

/**
 * A widget renderer is a plain function that receives the widget's
 * runtime context and returns the rendered React tree. Renderers are
 * pure with respect to their inputs plus whatever data they read via
 * hooks; the framework does not memoise them.
 *
 * @param context - Widget runtime context (config + change callback).
 * @returns The React tree to render for the widget instance.
 */
export type WidgetRenderer = (context: IWidgetRendererContext) => ReactNode;
