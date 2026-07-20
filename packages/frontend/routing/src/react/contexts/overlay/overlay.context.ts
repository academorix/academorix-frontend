/**
 * @file overlay.context.ts
 * @module @stackra/routing/react/contexts/overlay
 * @description React context that publishes the overlay stack state
 *   consumed by `<OverlayOutlet>`.
 *
 *   Default value has a no-op `openOverlay` / `closeOverlay` so
 *   consumers outside the provider don't crash — the framework's
 *   `<StackraRoutingProvider>` always mounts `<OverlayProvider>` so
 *   the fallback path is defensive only.
 */

import { createContext } from "react";

import type { IOverlayContext } from "./overlay-context-value.interface";

/**
 * Default context value — empty stack + noop mutators. `<StackraRoutingProvider>`
 * always mounts `<OverlayProvider>` which replaces this default.
 */
const defaultContext: IOverlayContext = {
  stack: [],
  activeId: null,
  // Silent noops keep the tree usable outside the provider — the
  // consuming component simply never opens/closes an overlay.
  openOverlay: () => {},
  closeOverlay: () => {},
};

/**
 * React context carrying the overlay stack state.
 */
export const OverlayContext = createContext<IOverlayContext>(defaultContext);
