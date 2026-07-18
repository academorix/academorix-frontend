/**
 * @file iconify.tsx
 * @module @stackra/ui/icons/iconify
 * @description Thin wrapper around `@iconify/react`'s `<Icon />` that
 *   ships with the Gravity UI icon set pre-registered.
 *
 *   ## Why this exists
 *
 *   Iconify is a universal icon renderer: one component that can render
 *   ~200 000 icons from ~150 sets by name (`logos:github`, `flag:us-4x3`,
 *   `simple-icons:x`, …). Names use the format `<set>:<name>`. Sets you
 *   register locally are resolved from memory; unknown sets are fetched
 *   from `api.iconify.design` on demand.
 *
 *   This wrapper does two things on top of the raw `<Icon />`:
 *
 *   1. **Bundles Gravity UI as the default set.** The full Gravity UI
 *      icon JSON is imported and registered into Iconify's global
 *      collection at module load. Consumers never call `addCollection`
 *      themselves — importing this module is enough.
 *   2. **Rewrites bare names.** An `icon` prop without a colon is
 *      assumed to be a Gravity UI name and prefixed with `gravity-ui:`
 *      before delegation. Names that already contain a colon
 *      (`logos:github-icon`) are passed through untouched so remote
 *      sets keep working.
 *
 *   ## Bundle-size tradeoff
 *
 *   Bundling Gravity UI adds ~200 KB (uncompressed) of JSON to any
 *   bundle that imports this module — even if the bundle never uses a
 *   Gravity icon. This is the intentional cost of the "bare name is
 *   Gravity" DX. Consumers who only render remote sets should either
 *   pass explicit prefixes and pay the cost anyway, or skip this
 *   wrapper and use `@iconify/react` directly.
 *
 *   ## Optional peer dependency
 *
 *   `@iconify/react` is declared as an **optional** peer of
 *   `@stackra/ui`. Consumers only need to install it when they import
 *   this subpath.
 *
 * @example
 * ```tsx
 * import { Iconify } from '@stackra/ui/icons/iconify';
 *
 * // Bare name → Gravity UI (bundled, resolves from memory)
 * <Iconify icon="star" width={20} />
 *
 * // Prefixed name → any Iconify set (resolves from api.iconify.design)
 * <Iconify icon="logos:github-icon" width={20} />
 *
 * // Force Gravity when the name accidentally contains a colon
 * <Iconify icon="my:custom-name" isGravityIcon />
 * ```
 */

import type { IconProps } from "@iconify/react";

import { addCollection, Icon } from "@iconify/react";
import { forwardRef } from "react";

import gravityIcons from "./gravity-ui/icons.json";

// ---------------------------------------------------------------------------
// Register the Gravity UI collection once, at module load, so `<Iconify />`
// can resolve bare names synchronously. Iconify keeps a single global
// registry per JS realm, so repeated imports are cheap (the collection is
// keyed by prefix and only added once).
// ---------------------------------------------------------------------------
addCollection(gravityIcons);

/**
 * Sorted list of every Gravity UI icon name registered by this module.
 *
 * Handy for pickers, catalogs, and search UIs that need to enumerate
 * the built-in icons without touching Iconify's internals.
 *
 * @example
 * ```tsx
 * import { gravityIconNames } from '@stackra/ui/icons/iconify';
 *
 * gravityIconNames.map((name) => <Iconify key={name} icon={name} />);
 * ```
 */
export const gravityIconNames = Object.keys(gravityIcons.icons).sort();

/**
 * Props accepted by {@link Iconify}.
 *
 * Extends every prop from Iconify's `<Icon />` except `icon`, which we
 * relax to accept both Iconify's structured icon type and any string
 * (so bare Gravity names typecheck without ceremony).
 */
export type IconifyProps = Omit<IconProps, "icon"> & {
  /**
   * Icon identifier.
   *
   * - **Bare name** (no `:`) — resolves to the bundled Gravity UI set.
   *   Example: `"star"` → `gravity-ui:star`.
   * - **Prefixed name** (`set:name`) — resolves via Iconify. Sets not
   *   registered locally are fetched from `api.iconify.design` and
   *   cached in `localStorage` by Iconify.
   *   Example: `"logos:github-icon"`.
   * - **Structured `IconifyIcon` object** — passed through untouched
   *   for consumers already working with Iconify's icon data type.
   */
  icon: IconProps["icon"] | string;

  /**
   * Force the Gravity UI resolver even when `icon` contains a colon.
   *
   * The default heuristic ("no colon → Gravity") covers 99% of cases;
   * this escape hatch is only needed when a Gravity icon name legitimately
   * contains a colon (rare, but the icon set is user-extensible).
   *
   * - `undefined` (default) — infer from `icon` string shape.
   * - `true`  — always route through Gravity.
   * - `false` — never route through Gravity even if the name is bare.
   */
  isGravityIcon?: boolean;
};

/**
 * Iconify-backed icon component with Gravity UI as the default set.
 *
 * Renders any icon in Iconify's ~200 000-icon universe. Bare names
 * resolve to the bundled Gravity UI collection; prefixed names go
 * through Iconify's normal set resolver (memory first, then remote CDN).
 *
 * Forwards the underlying `<svg>` ref so consumers can measure or
 * animate the rendered icon.
 *
 * @param props - Icon props. See {@link IconifyProps}.
 * @param ref   - Forwarded to the rendered `<svg>` element.
 *
 * @example
 * ```tsx
 * <Iconify icon="chevron-right" width={16} className="text-default-500" />
 * <Iconify icon="flag:us-4x3" width={24} />
 * ```
 */
export const Iconify = forwardRef<SVGSVGElement, IconifyProps>(
  ({ icon: iconProp, isGravityIcon, ...props }, ref) => {
    // Route bare-string names to Gravity UI unless the caller explicitly
    // opted out via `isGravityIcon={false}`. Non-string values (structured
    // `IconifyIcon` objects) always pass through.
    const shouldUseGravityIcon =
      typeof iconProp === "string" && (isGravityIcon ?? !iconProp.includes(":"));
    const icon = shouldUseGravityIcon ? "gravity-ui:" + iconProp : iconProp;

    return <Icon {...props} ref={ref} icon={icon} />;
  },
);

Iconify.displayName = "HeroUIBuilder.Iconify";
