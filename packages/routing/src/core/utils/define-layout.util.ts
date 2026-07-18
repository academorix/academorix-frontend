/**
 * @file define-layout.util.ts
 * @module @stackra/routing/core/utils
 * @description Typed identity helper for authoring a layout module.
 *
 *   Layout modules colocate a `default` component export and a
 *   `layout` config export of shape {@link ILayoutConfig}. The
 *   framework's route adapter detects `layout` vs `page` at load
 *   time and wires the layout into the RRv7 route tree.
 */

import type { ILayoutConfig } from "@stackra/contracts";

/**
 * Typed identity for a layout config.
 *
 * @param config - Layout config.
 * @returns The same object, strictly typed against `ILayoutConfig`.
 *
 * @example
 * ```typescript
 * // src/layouts/authenticated.layout.tsx
 * import { defineLayout } from '@stackra/routing';
 *
 * export default function AuthenticatedLayout() { … }
 *
 * export const layout = defineLayout({
 *   middleware: ['@authenticated'],
 *   seo: { robots: 'noindex' },
 * });
 * ```
 */
export function defineLayout(config: ILayoutConfig): ILayoutConfig {
  return config;
}
