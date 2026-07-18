/**
 * @file command-palette.interface.ts
 * @module @academorix/dashboard/services/command-palette
 * @description Reactive snapshot for {@link CommandPaletteService}.
 */

/** Reactive state of the command palette. */
export interface ICommandPaletteSnapshot {
  /** Whether the palette is currently open. */
  readonly isOpen: boolean;
}
