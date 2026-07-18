/**
 * @file colorize.util.ts
 * @module @stackra/container/devtools
 * @description Utility for colorizing terminal output.
 */

import { COLORS } from "./colors.constant";

/**
 * Wrap text in ANSI color codes (or return plain text if colors disabled).
 *
 * @param text - The text to colorize
 * @param color - The color key from COLORS
 * @param useColors - Whether to apply colors or return plain text
 * @returns Colorized or plain text
 */
export function colorize(text: string, color: keyof typeof COLORS, useColors: boolean): string {
  return useColors ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}
