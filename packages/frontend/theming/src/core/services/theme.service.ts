/**
 * @file theme.service.ts
 * @module @stackra/theming/services
 * @description Central orchestrator for theming operations.
 *   Coordinates mode changes, token application, persistence,
 *   system-preference subscriptions, and event emission.
 */

import { Injectable, Inject } from "@stackra/container";
import type { IThemeBindings, ColorMode, ResolvedMode, OnModuleInit } from "@stackra/contracts";
import { THEME_BINDINGS, THEMING_CONFIG, THEME_REGISTRY } from "@stackra/contracts";
import type { IThemingModuleOptions } from "../interfaces";
import { THEME_TOKEN_STORE } from "../tokens";
import { ThemeRegistry } from "../registries";
import { ThemeTokenStore } from "../stores";
import { ThemeNotFoundError } from "../errors";

// ============================================================================
// Service
// ============================================================================

/**
 * Central orchestrator for theming operations.
 *
 * Coordinates mode changes, token application, persistence,
 * system-preference subscriptions, and event emission.
 */
@Injectable()
export class ThemeService implements OnModuleInit {
  /** Unsubscribe function for system color scheme changes. */
  private systemCleanup: (() => void) | null = null;

  /**
   * @param config - Module configuration.
   * @param bindings - Platform bindings adapter.
   * @param registry - Theme registry.
   * @param store - Reactive token store.
   */
  public constructor(
    @Inject(THEMING_CONFIG) private readonly config: IThemingModuleOptions,
    @Inject(THEME_BINDINGS) private readonly bindings: IThemeBindings,
    @Inject(THEME_REGISTRY) private readonly registry: ThemeRegistry,
    @Inject(THEME_TOKEN_STORE) private readonly store: ThemeTokenStore,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Initialize from persisted state and subscribe to system changes.
   */
  public onModuleInit(): void {
    this.store.initialize(
      this.config.defaultTheme ?? "default",
      this.config.defaultMode ?? "system",
    );
    this.registry.seedBuiltInThemes();
    if (this.config.themes) {
      this.registry.seedConfigThemes(this.config.themes);
    }
    this.restorePersistedState();
    this.subscribeToSystemChanges();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Set the color mode preference.
   * Persists, resolves, applies, and emits events.
   *
   * @param mode - The color mode to set.
   */
  public setMode(mode: ColorMode): void {
    const resolvedMode = this.resolveMode(mode);

    this.bindings.setPersistedMode(mode);
    this.bindings.applyColorMode(resolvedMode);
    this.store.setState({ mode, resolvedMode });
  }

  /**
   * Activate a named theme preset.
   * Validates, persists, applies tokens, and emits events.
   *
   * @param id - Theme ID to activate.
   * @throws {ThemeNotFoundError} When the theme is not registered.
   */
  public setTheme(id: string): void {
    if (!this.registry.has(id)) {
      throw new ThemeNotFoundError(id, this.registry.getThemeIds());
    }

    this.bindings.setPersistedTheme(id);
    this.store.setState({ themeId: id });
  }

  /**
   * Get the current theme state snapshot.
   *
   * @returns The current IThemeState.
   */
  public getState() {
    return this.store.getState();
  }

  /**
   * Clean up system change subscription.
   */
  public destroy(): void {
    if (this.systemCleanup) {
      this.systemCleanup();
      this.systemCleanup = null;
    }
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Resolve 'system' mode to 'light' or 'dark'.
   *
   * @param mode - The user-selected color mode.
   * @returns The resolved actual mode.
   */
  private resolveMode(mode: ColorMode): ResolvedMode {
    if (mode === "system") {
      return this.bindings.getSystemColorScheme();
    }
    return mode;
  }

  /**
   * Read persisted values and restore state on boot.
   */
  private restorePersistedState(): void {
    try {
      const persistedMode = this.bindings.getPersistedMode();
      const persistedTheme = this.bindings.getPersistedTheme();

      const mode = persistedMode ?? this.config.defaultMode ?? "system";
      const themeId = persistedTheme ?? this.config.defaultTheme ?? "default";
      const resolvedMode = this.resolveMode(mode);

      this.bindings.applyColorMode(resolvedMode);
      this.store.setState({ mode, themeId, resolvedMode });
    } catch {
      // NullThemeBindings throws — expected when no platform module loaded yet.
      // Silently skip restoration; bindings will be configured later.
    }
  }

  /**
   * Subscribe to OS-level color scheme changes.
   */
  private subscribeToSystemChanges(): void {
    try {
      this.systemCleanup = this.bindings.subscribeToSystemChanges((newScheme) => {
        const { mode } = this.store.getState();
        if (mode !== "system") return;
        this.bindings.applyColorMode(newScheme);
        this.store.setState({ resolvedMode: newScheme });
      });
    } catch {
      // NullThemeBindings throws — ignore.
    }
  }
}
