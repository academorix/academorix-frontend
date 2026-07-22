/**
 * @file command-palette-listener.type.ts
 * CommandPaletteListener — Type.
 *
 * @module @stackra/kbd/types
 */

import type { CommandPaletteState } from "../interfaces/command-palette-state.interface";

/**
 * Subscriber callback signature.
 */
export type CommandPaletteListener = (state: CommandPaletteState) => void;
