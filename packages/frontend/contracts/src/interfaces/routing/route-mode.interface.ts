/**
 * @file route-mode.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Presentation-mode marker for a route — a route renders
 *   as a full page (default) or as an overlay (dialog / drawer / sheet).
 */

/**
 * Presentation mode for a route.
 *
 * - `page` — standard full-viewport route.
 * - `dialog` — renders as a HeroUI `<Modal>` overlay.
 * - `drawer` — renders as a HeroUI `<Drawer>` overlay.
 * - `sheet` — renders as a HeroUI Pro `<Sheet>` side panel.
 */
export type IRouteMode = "page" | "dialog" | "drawer" | "sheet";
