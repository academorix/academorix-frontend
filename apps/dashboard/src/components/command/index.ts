/**
 * @file index.ts
 * @module components/command
 *
 * @description
 * Public barrel for the global command palette. Consumers mount
 * {@link CommandPaletteProvider} + {@link CommandPalette} once at the
 * authenticated shell root and call {@link useCommandPalette} to open, close,
 * or toggle the palette from anywhere in the tree.
 */

export { CommandPalette } from "@/components/command/command-palette";
export {
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/command/command-palette-provider";
