/**
 * @fileoverview PaletteThemeRegistry — registry of palette visual themes.
 *
 * Stores {@link PaletteTheme} entries keyed by id. Pre-seeded with
 * the built-in themes (`default`, `raycast`, `spotlight`) on module
 * init. Apps add their own through `KbdModule.forFeature({ themes })`.
 *
 * @module @stackra/kbd
 * @category Registries
 */

import { Injectable, Inject, Optional, type OnModuleInit } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { KBD_CONFIG } from "../tokens";
import type { KbdModuleOptions } from "../interfaces/kbd-config.interface";
import type { PaletteTheme } from "../interfaces/palette-theme.interface";
import { BUILTIN_PALETTE_THEMES, defaultTheme } from "../themes";

/**
 * Registry of palette themes.
 *
 * Resolution order:
 * 1. The id requested by the caller.
 * 2. The configured `defaultPaletteTheme`.
 * 3. The built-in `default` theme.
 */
@Injectable()
export class PaletteThemeRegistry
  extends BaseRegistry<string, PaletteTheme>
  implements OnModuleInit
{
  /**
   * Wire the registry.
   */
  public constructor(@Optional() @Inject(KBD_CONFIG) private readonly config?: KbdModuleOptions) {
    super();
  }

  /**
   * Seed built-in themes on init.
   */
  public onModuleInit(): void {
    for (const theme of BUILTIN_PALETTE_THEMES) {
      if (!this.has(theme.id)) this.register(theme.id, theme);
    }
  }

  /**
   * Register or replace a theme.
   */
  public registerTheme(theme: PaletteTheme): void {
    this.registerOrReplace(theme.id, theme);
  }

  /**
   * Resolve a theme by id with fallback chain.
   */
  public resolve(id?: string): PaletteTheme {
    if (id) {
      const found = this.get(id);
      if (found) return found;
    }
    const fallbackId = this.config?.defaultPaletteTheme ?? "default";
    return this.get(fallbackId) ?? defaultTheme;
  }

  /**
   * Sorted snapshot — alphabetical by label.
   */
  public getOrdered(): PaletteTheme[] {
    return [...this.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Read-only snapshot of every registered theme. Ergonomic alias
   * for `values()`.
   */
  public getAll(): PaletteTheme[] {
    return this.values();
  }
}
