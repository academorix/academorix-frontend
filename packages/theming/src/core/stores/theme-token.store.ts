/**
 * @file theme-token.store.ts
 * @module @stackra/theming/stores
 * @description Reactive state store for theming.
 *   Holds current themeId, mode, resolvedMode, tokens, and registryRevision.
 *   Supports subscriptions for useSyncExternalStore integration.
 */

import { Injectable } from '@stackra/container';
import type { IDesignTokenMap, ColorMode, ResolvedMode } from '@stackra/contracts';

// ============================================================================
// State Interface
// ============================================================================

/**
 * Snapshot of the theming module's reactive state.
 *
 * Consumed by `useSyncExternalStore` bridges in the React subpath and by
 * every service that needs to read the currently-active theme without
 * touching platform bindings.
 */
export interface IThemeState {
  /** Currently active theme identifier. */
  readonly themeId: string;
  /** User-selected color mode ('light' / 'dark' / 'system'). */
  readonly mode: ColorMode;
  /** Resolved mode after applying 'system' → OS preference. */
  readonly resolvedMode: ResolvedMode;
  /** Design-token map for the active theme (server-hydrated themes only). */
  readonly tokens: IDesignTokenMap;
  /** Monotonic revision counter used to bust registry-derived memos. */
  readonly registryRevision: number;
}

// ============================================================================
// Store
// ============================================================================

/**
 * Reactive state store for theming.
 *
 * Provides `subscribe()` for `useSyncExternalStore` integration and
 * `getState()` / `setState()` for reading and updating the state.
 */
@Injectable()
export class ThemeTokenStore {
  /** Internal state. */
  private state: IThemeState;

  /** Subscriber callbacks. */
  private readonly listeners = new Set<(state: IThemeState) => void>();

  public constructor() {
    this.state = {
      themeId: 'default',
      mode: 'system',
      resolvedMode: 'light',
      tokens: {},
      registryRevision: 0,
    };
  }

  /**
   * Initialize state from module configuration.
   *
   * @param defaultTheme - Initial theme ID.
   * @param defaultMode - Initial color mode.
   */
  public initialize(defaultTheme: string, defaultMode: ColorMode): void {
    this.state = {
      ...this.state,
      themeId: defaultTheme,
      mode: defaultMode,
    };
  }

  /**
   * Get the full state snapshot.
   *
   * @returns Current theme state.
   */
  public getState(): IThemeState {
    return this.state;
  }

  /**
   * Update state fields. Notifies all subscribers.
   *
   * @param partial - Partial state to merge.
   */
  public setState(partial: Partial<IThemeState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Subscribe to state changes. Returns unsubscribe function.
   *
   * @param listener - Callback invoked on state change.
   * @returns Unsubscribe function.
   */
  public subscribe(listener: (state: IThemeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Increment the registry revision counter.
   * Triggers re-renders for components that depend on the theme list.
   */
  public incrementRevision(): void {
    this.setState({ registryRevision: this.state.registryRevision + 1 });
  }

  /**
   * Store tokens for a specific theme ID (remote/API tokens).
   *
   * @param themeId - The theme these tokens belong to.
   * @param tokens - Token map to store.
   */
  public setTokens(themeId: string, tokens: IDesignTokenMap): void {
    if (themeId === this.state.themeId) {
      this.setState({ tokens });
    }
  }

  /**
   * Get stored tokens for the active theme.
   *
   * @param themeId - Theme ID to look up.
   * @returns Token map or null.
   */
  public getTokens(themeId: string): IDesignTokenMap | null {
    if (themeId === this.state.themeId && Object.keys(this.state.tokens).length > 0) {
      return this.state.tokens;
    }
    return null;
  }

  /**
   * Notify all subscribers of a state change.
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
