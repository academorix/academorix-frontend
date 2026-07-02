/**
 * @file index.ts
 * @module @academorix/ui/icons
 *
 * @description
 * Shared icon typing for the heroicons re-exported under
 * `@academorix/ui/icons/{outline,solid,mini,micro}`. Use {@link IconType} wherever
 * a component wants to accept "an icon" as a prop (nav items, buttons, KPIs).
 */

import type { ComponentType, SVGProps } from "react";

/**
 * A heroicons-compatible icon component. Accepts standard SVG props
 * (`className`, `aria-hidden`, `title`, …), so it fits every glyph exported by
 * `@academorix/ui/icons/*`.
 *
 * @example
 * ```tsx
 * import type { IconType } from "@academorix/ui/icons";
 * import { AcademicCapIcon } from "@academorix/ui/icons/outline";
 *
 * const icon: IconType = AcademicCapIcon;
 * <icon className="size-5" aria-hidden="true" />
 * ```
 */
export type IconType = ComponentType<SVGProps<SVGSVGElement>>;
