/**
 * Kbd Facades — Lazy DI proxies for keyboard services.
 *
 * @module @stackra/kbd
 * @category Facades
 */

import { inject } from "@stackra/container";
import {
  SHORTCUT_REGISTRY,
  COMMAND_REGISTRY,
  COMMAND_TYPE_REGISTRY,
  PALETTE_THEME_REGISTRY,
  COMMAND_PALETTE_SERVICE,
  KEYBOARD_CATALOG_SERVICE,
  KEYBOARD_HINTS_SERVICE,
} from "../tokens";

/** Lazy proxy for the ShortcutRegistry. */
export const kbd: any = inject(SHORTCUT_REGISTRY);

/** Lazy proxy for the CommandRegistry. */
export const command: any = inject(COMMAND_REGISTRY);

/** Lazy proxy for the CommandTypeRegistry. */
export const commandType: any = inject(COMMAND_TYPE_REGISTRY);

/** Lazy proxy for the PaletteThemeRegistry. */
export const paletteTheme: any = inject(PALETTE_THEME_REGISTRY);

/** Lazy proxy for the CommandPaletteService. */
export const commandPalette: any = inject(COMMAND_PALETTE_SERVICE);

/** Lazy proxy for the KeyboardCatalogService. */
export const keyboardCatalog: any = inject(KEYBOARD_CATALOG_SERVICE);

/** Lazy proxy for the KeyboardHintsService. */
export const keyboardHints: any = inject(KEYBOARD_HINTS_SERVICE);
