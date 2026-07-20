/**
 * @file theme.registry.ts
 * @module @stackra/theming/registries
 * @description Typed registry holding all registered theme presets.
 *   Extends BaseRegistry from @stackra/support and auto-increments
 *   the store's registryRevision on every mutation to trigger React re-renders.
 */

import { Injectable } from '@stackra/container';
import { BaseRegistry } from '@stackra/support';
import type { ITheme } from '@stackra/contracts';
import { BUILT_IN_THEMES } from '../constants';

// ============================================================================
// Registry
// ============================================================================

/**
 * Typed registry holding all registered theme presets.
 *
 * Extends `BaseRegistry<string, ITheme>` from `@stackra/support`
 * and provides convenience methods for theme management.
 */
@Injectable()
export class ThemeRegistry extends BaseRegistry<string, ITheme> {
  /** Registry mutation counter for triggering re-renders. */
  private revision = 0;

  /**
   * Get the current registry revision.
   *
   * @returns The revision counter value.
   */
  public getRevision(): number {
    return this.revision;
  }

  /**
   * Register a theme preset. Increments registry revision.
   *
   * @param id - Unique theme identifier.
   * @param config - Theme configuration.
   * @returns this (for chaining).
   */
  public override register(id: string, config: ITheme): this {
    super.register(id, config);
    this.revision++;
    return this;
  }

  /**
   * Remove a theme preset. Increments registry revision.
   *
   * @param id - Theme identifier to remove.
   * @returns Whether the theme was removed.
   */
  public override remove(id: string): boolean {
    const result = super.remove(id);
    if (result) this.revision++;
    return result;
  }

  /**
   * Seed built-in themes into the registry.
   * Called during module initialization.
   */
  public seedBuiltInThemes(): void {
    for (const theme of BUILT_IN_THEMES) {
      if (!this.has(theme.id)) {
        super.register(theme.id, theme);
      }
    }
  }

  /**
   * Seed additional themes from module configuration.
   *
   * @param themes - Array of theme configs to register.
   */
  public seedConfigThemes(themes: readonly ITheme[]): void {
    for (const theme of themes) {
      if (!this.has(theme.id)) {
        super.register(theme.id, theme);
      }
    }
  }

  /**
   * Returns all registered themes in registration order.
   *
   * @returns Array of theme configurations.
   */
  public getThemes(): ITheme[] {
    return this.values();
  }

  /**
   * Returns theme ids — used by UI components.
   *
   * @returns Array of theme ID strings.
   */
  public getThemeIds(): string[] {
    return this.keys();
  }
}
