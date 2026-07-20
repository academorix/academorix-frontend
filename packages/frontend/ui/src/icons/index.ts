/**
 * @file index.ts
 * @module @stackra/ui/icons
 * @description Shared icon typing for the heroicons re-exported under
 *   `@stackra/ui/icons/heroicon/{outline,solid,mini,micro}`. Use
 *   {@link IconType} wherever a component wants to accept "an icon"
 *   as a prop (nav items, buttons, KPIs).
 *
 *   Kept at the `./icons` root subpath (bare, no glyph pack) so
 *   consumers can import the type in one place regardless of which
 *   pack they render at the call site.
 */

import type { ComponentType, SVGProps } from "react";

/**
 * A heroicons-compatible icon component. Accepts standard SVG props
 * (`className`, `aria-hidden`, `title`, …), so it fits every glyph
 * exported by `@stackra/ui/icons/heroicon/*`.
 *
 * @example
 * ```tsx
 * import type { IconType } from "@stackra/ui/icons";
 * import { AcademicCapIcon } from "@stackra/ui/icons/heroicon/outline";
 *
 * const icon: IconType = AcademicCapIcon;
 * <icon className="size-5" aria-hidden="true" />
 * ```
 */
export type IconType = ComponentType<SVGProps<SVGSVGElement>>;
