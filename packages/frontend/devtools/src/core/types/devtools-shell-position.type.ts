/**
 * @file devtools-shell-position.type.ts
 * @module @stackra/devtools/core/types
 * @description Placement of the devtools drawer/sheet within the
 *   viewport.
 */

/**
 * Which edge of the viewport the devtools shell slides in from.
 *
 * `'right'` is the workspace default (matches Nuxt Devtools + the
 * majority of browser inspectors). `'bottom'` is the mobile-friendly
 * default on native, but is also selectable on the web shell.
 */
export type DevtoolsShellPosition = "left" | "right" | "top" | "bottom";
