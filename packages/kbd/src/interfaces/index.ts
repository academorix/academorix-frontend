/**
 * Interfaces Barrel Export
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

export type { KeyCombo, KeyComboModifiers } from "./key-combo.interface";
export type { Shortcut, ShortcutScope, ShortcutGuard } from "./shortcut.interface";
export type { Command, CommandContext, CommandHandler, CommandSource } from "./command.interface";
export type { KbdModuleOptions } from "./kbd-config.interface";
export type { CommandType } from "./command-type.interface";
export type {
  PaletteTheme,
  PaletteBackdropVariant,
  PaletteItemLayout,
  PaletteListDensity,
  PalettePlacement,
  PaletteSearchVariant,
} from "./palette-theme.interface";
