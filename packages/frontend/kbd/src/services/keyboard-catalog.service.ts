/**
 * @fileoverview KeyboardCatalogService — owns the catalog modal state.
 *
 * The catalog renders every registered shortcut, grouped by type, with
 * search and tabbed navigation. State is centralized here so the
 * catalog can be toggled imperatively from anywhere (header trigger,
 * `?` shortcut, palette command).
 *
 * Uses a DI-managed TanStack Store (`KEYBOARD_CATALOG_STORE`) for reactive
 * state. Components subscribe via `useStore()` — no manual subscribe
 * pattern needed.
 *
 * @module @stackra/kbd
 * @category Services
 */

import { Inject, Injectable } from "@stackra/container";

import { KEYBOARD_CATALOG_STORE } from "../tokens";
import type { Store } from "@tanstack/store";
import type { KeyboardCatalogState } from "../interfaces/keyboard-catalog-state.interface";

/**
 * Service for the keyboard shortcut catalog.
 *
 * Uses a DI-managed TanStack Store (`KEYBOARD_CATALOG_STORE`) for reactive
 * state. Components subscribe via `useStore()` — no manual subscribe
 * pattern needed.
 */
@Injectable()
export class KeyboardCatalogService {
  public constructor(
    @Inject(KEYBOARD_CATALOG_STORE) private readonly store: Store<KeyboardCatalogState>,
  ) {}

  /**
   * Snapshot of the current state.
   */
  public getState(): KeyboardCatalogState {
    return this.store.state;
  }

  /**
   * Open the catalog modal.
   *
   * Idempotent — calling when already open is a no-op.
   */
  public open(): void {
    this.update({ isOpen: true });
  }

  /**
   * Close the catalog modal.
   *
   * Idempotent — calling when already closed is a no-op.
   */
  public close(): void {
    this.update({ isOpen: false });
  }

  /**
   * Toggle the catalog modal.
   *
   * Used by the `?` global shortcut and the header trigger button.
   */
  public toggle(): void {
    this.update({ isOpen: !this.store.state.isOpen });
  }

  /**
   * Set the active tab id.
   *
   * Tab ids are command type names (e.g. `"navigation"`, `"action"`)
   * or the special value `"all"` to clear the type filter.
   *
   * @param tab - The tab id to activate.
   */
  public setTab(tab: string): void {
    this.update({ activeTab: tab });
  }

  /**
   * Set the search query.
   *
   * Filters the displayed shortcuts by label, description, and combo.
   * Empty string shows everything.
   *
   * @param query - The query string.
   */
  public setQuery(query: string): void {
    this.update({ query });
  }

  /**
   * Merge a partial state into the store.
   */
  private update(partial: Partial<KeyboardCatalogState>): void {
    this.store.setState((s) => ({ ...s, ...partial }));
  }
}
