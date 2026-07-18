/**
 * @file ascii-banner.util.ts
 * @module @stackra/console/utils
 * @description ASCII art banner generator for CLI startup display.
 *   Renders the application name as a styled ASCII art header with
 *   version and environment information.
 */

import { Str } from "@stackra/support";
import pc from "picocolors";

import type { IBannerOptions } from "../interfaces/banner-options.interface";

/**
 * Built-in ASCII art font map for rendering banner text.
 * Uses a compact 5-line font for clean terminal output.
 */
const FONT_MAP: Record<string, string[]> = {
  S: ["▄▄▄▄▄", "█    ", "▀▀▀▀▄", "    █", "▄▄▄▄▀"],
  T: ["▄▄▄▄▄", "  █  ", "  █  ", "  █  ", "  █  "],
  A: [" ▄▄▄ ", "█   █", "█▄▄▄█", "█   █", "█   █"],
  C: ["▄▄▄▄▄", "█    ", "█    ", "█    ", "▀▀▀▀▀"],
  K: ["█   █", "█  █ ", "█▄█  ", "█  █ ", "█   █"],
  R: ["▄▄▄▄ ", "█   █", "█▄▄▄▀", "█  █ ", "█   █"],
  " ": ["     ", "     ", "     ", "     ", "     "],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  G: ["▄▄▄▄▄", "█    ", "█  ▄▄", "█   █", "▀▀▀▀▀"],
  O: ["▄▄▄▄▄", "█   █", "█   █", "█   █", "▀▀▀▀▀"],
  E: ["▄▄▄▄▄", "█    ", "█▄▄▄ ", "█    ", "▀▀▀▀▀"],
  L: ["█    ", "█    ", "█    ", "█    ", "▀▀▀▀▀"],
  I: ["▄▄▄▄▄", "  █  ", "  █  ", "  █  ", "▀▀▀▀▀"],
  D: ["▄▄▄▄ ", "█   █", "█   █", "█   █", "▀▀▀▀ "],
  P: ["▄▄▄▄ ", "█   █", "█▄▄▄▀", "█    ", "█    "],
  Q: ["▄▄▄▄▄", "█   █", "█ █ █", "█  ██", "▀▀▀▀█"],
  U: ["█   █", "█   █", "█   █", "█   █", "▀▀▀▀▀"],
  V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
  X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  Z: ["▀▀▀▀█", "   █ ", "  █  ", " █   ", "█▀▀▀▀"],
  B: ["▄▄▄▄ ", "█   █", "█▄▄▄▀", "█   █", "▀▀▀▀ "],
  F: ["▄▄▄▄▄", "█    ", "█▄▄▄ ", "█    ", "█    "],
  H: ["█   █", "█   █", "█▄▄▄█", "█   █", "█   █"],
  J: ["    █", "    █", "    █", "█   █", "▀▀▀▀▀"],
};

/**
 * Render an ASCII art banner for the CLI startup.
 *
 * Produces a styled multi-line ASCII art header with the application name,
 * version badge, and environment indicator.
 *
 * @param options - Banner rendering options
 * @returns The rendered banner string (multi-line, includes newlines)
 *
 * @example
 * ```typescript
 * const banner = renderBanner({ name: 'STACKRA', version: '0.1.0' });
 * process.stdout.write(banner);
 * ```
 */
export function renderBanner(options: IBannerOptions): string {
  const { name, version, environment, color = pc.cyan } = options;
  // Route through `Str.upper` per `.kiro/steering/support-utilities.md`
  // instead of a bare `.toUpperCase()`.
  const upperName = Str.upper(name);
  const lines: string[] = ["", ""];

  // Render each line of the 5-line font
  for (let row = 0; row < 5; row++) {
    let line = "  ";
    for (const char of upperName) {
      const glyph = FONT_MAP[char] ?? FONT_MAP[" "]!;
      line += glyph[row] + " ";
    }
    lines.push(color(line));
  }

  lines.push("");

  // Version and environment badge
  const badges: string[] = [];
  if (version) {
    badges.push(pc.dim(`v${version}`));
  }
  if (environment) {
    badges.push(pc.dim(`[${environment}]`));
  }
  if (badges.length > 0) {
    lines.push(`  ${badges.join(" ")}`);
  }

  lines.push("");

  return lines.join("\n");
}

/**
 * Render a compact single-line banner (fallback for narrow terminals).
 *
 * @param options - Banner options
 * @returns Single-line styled string
 */
export function renderCompactBanner(options: IBannerOptions): string {
  const { name, version, environment, color = pc.cyan } = options;

  let line = `  ${color(pc.bold(name))}`;
  if (version) line += ` ${pc.dim(`v${version}`)}`;
  if (environment) line += ` ${pc.dim(`[${environment}]`)}`;

  return `\n${line}\n`;
}
