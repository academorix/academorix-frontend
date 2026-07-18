/**
 * @file overlay-context-value.interface.ts
 * @module @stackra/routing/react/contexts/overlay
 * @description The React context value published by
 *   `<OverlayProvider>` — tracks the stack of open overlay routes
 *   (dialog / drawer / sheet) so `<OverlayOutlet>` can render the
 *   topmost one.
 */

/**
 * A single open-overlay entry — the route id and any params captured
 * when the overlay opened.
 */
export interface IOverlayEntry {
  /** Route id — matches the id in the RRv7 match chain. */
  readonly id: string;

  /** Pathname of the overlay route. */
  readonly pathname: string;
}

/**
 * Shape of the overlay context value. `<OverlayOutlet>` reads
 * `stack` + `activeId`; callers imperative-navigating rely on the
 * `openOverlay` / `closeOverlay` helpers.
 */
export interface IOverlayContext {
  /** Ordered stack of currently-open overlays. Innermost last. */
  readonly stack: readonly IOverlayEntry[];

  /** The topmost open overlay's route id — `null` when none open. */
  readonly activeId: string | null;

  /** Open a new overlay (push onto the stack). */
  readonly openOverlay: (entry: IOverlayEntry) => void;

  /** Close the topmost overlay (pop the stack). */
  readonly closeOverlay: () => void;
}
