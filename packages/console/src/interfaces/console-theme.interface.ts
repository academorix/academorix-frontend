/**
 * @file console-theme.interface.ts
 * @module @stackra/console/interfaces
 * @description Full console theme configuration — palette, icons, layout knobs.
 */

import type { IConsoleIcons } from "./console-icons.interface";
import type { IConsolePalette } from "./console-palette.interface";

/**
 * Full console theme configuration.
 */
export interface IConsoleTheme {
  /** Color palette. */
  palette: IConsolePalette;
  /** Icon/glyph set. */
  icons: IConsoleIcons;
  /** Indent size (number of spaces). Default: 2 */
  indent: number;
  /** Whether to show timestamps in log output. Default: false */
  showTimestamp: boolean;
  /** Prefix for all output lines. Default: '' */
  prefix: string;
  /** Whether to use boxen for section headers. Default: true */
  useBoxes: boolean;
}
