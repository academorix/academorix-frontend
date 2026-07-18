/**
 * @fileoverview KeyboardHintsService — toggles the on-screen hints overlay.
 *
 * The hints overlay annotates DOM elements that opt in (via the
 * `data-shortcut` attribute or `<ShortcutHint>` wrapper) with a small
 * Kbd chip showing the bound combo. This service owns the
 * boolean toggle so the icon button in the header and the `Cmd+/`
 * shortcut share state.
 *
 * Uses a DI-managed TanStack Store (`KEYBOARD_HINTS_STORE`) for reactive
 * state. Components subscribe via `useStore()` — no manual subscribe
 * pattern needed.
 *
 * @module @stackra/kbd
 * @category Services
 */

import { Inject, Injectable } from "@stackra/container";

import { KEYBOARD_HINTS_STORE } from "../tokens";
import type { Store } from "@tanstack/store";

/**
 * Service for the on-screen keyboard-hints overlay.
 *
 * Uses a DI-managed TanStack Store (`KEYBOARD_HINTS_STORE`) for reactive
 * state. Components subscribe via `useStore()` — no manual subscribe
 * pattern needed.
 */
@Injectable()
export class KeyboardHintsService {
  public constructor(
    @Inject(KEYBOARD_HINTS_STORE) private readonly store: Store<{ visible: boolean }>,
  ) {}

  /**
   * Whether the hints overlay is currently visible.
   */
  public isVisible(): boolean {
    return this.store.state.visible;
  }

  /**
   * Show the hints overlay.
   *
   * Forces the overlay visible regardless of current state. Subscribers
   * are only notified when the value actually changes.
   */
  public show(): void {
    this.store.setState((s) => ({ ...s, visible: true }));
  }

  /**
   * Hide the hints overlay.
   *
   * Forces the overlay hidden. Subscribers are only notified when the
   * value actually changes.
   */
  public hide(): void {
    this.store.setState((s) => ({ ...s, visible: false }));
  }

  /**
   * Toggle the hints overlay.
   *
   * Flips between visible and hidden — used by the `Cmd+/` global
   * shortcut and the header icon button.
   */
  public toggle(): void {
    this.store.setState((s) => ({ ...s, visible: !s.visible }));
  }
}
