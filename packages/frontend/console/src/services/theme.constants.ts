/**
 * @file theme.constants.ts
 * @module @stackra/console/services
 * @description Framework-shipped theme presets — `DEFAULT_THEME` (used unless
 *   the consumer calls `setTheme(...)`) plus two alternates (`MINIMAL_THEME`
 *   for plain-terminal environments, `VIBRANT_THEME` for TTYs that render
 *   full colour + Unicode glyphs).
 *
 *   All three presets are just readonly bags of `ColorFn`s + glyph strings —
 *   `setTheme(preset)` deep-merges them onto the active theme.
 */

import pc from "picocolors";

import type { IConsoleIcons } from "../interfaces/console-icons.interface";
import type { IConsolePalette } from "../interfaces/console-palette.interface";
import type { IConsoleTheme } from "../interfaces/console-theme.interface";

/**
 * Default colour palette — cyan brand + semantic tinting. Every ANSI code
 * is fetched from `picocolors`, which auto-detects TTY support and no-ops
 * when the output is piped.
 */
export const DEFAULT_PALETTE: IConsolePalette = {
  primary: pc.cyan,
  accent: pc.magenta,
  banner: (s: string): string => pc.bgCyan(pc.black(s)),
  muted: pc.dim,
  info: pc.cyan,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  label: pc.bold,
  value: (s: string): string => s,
  border: pc.dim,
  url: pc.blue,
  highlight: pc.bold,
};

/**
 * Default glyph set — Unicode-first with ASCII-friendly picks so most
 * terminals render every icon correctly.
 */
export const DEFAULT_ICONS: IConsoleIcons = {
  arrow: "→",
  bullet: "•",
  pointer: "▶",
  info: "ℹ",
  success: "✔",
  warning: "⚠",
  error: "✖",
  active: "◆",
  skip: "○",
  line: "─",
};

/**
 * Default console theme — 2-space indent, no timestamps, boxen enabled.
 * Consumers who want a plain terminal can `setTheme(MINIMAL_THEME)`.
 */
export const DEFAULT_THEME: IConsoleTheme = {
  palette: DEFAULT_PALETTE,
  icons: DEFAULT_ICONS,
  indent: 2,
  showTimestamp: false,
  prefix: "",
  useBoxes: true,
};

/**
 * Minimal theme — ASCII-only glyphs, identity-function palette (no colour),
 * no boxes. Good for CI logs and dumb-terminal environments where ANSI
 * escapes render as literal `\u001b[...` characters.
 */
const identity = (s: string): string => s;

export const MINIMAL_THEME: IConsoleTheme = {
  palette: {
    primary: identity,
    accent: identity,
    banner: identity,
    muted: identity,
    info: identity,
    success: identity,
    warning: identity,
    error: identity,
    label: identity,
    value: identity,
    border: identity,
    url: identity,
    highlight: identity,
  },
  icons: {
    arrow: ">",
    bullet: "-",
    pointer: ">",
    info: "i",
    success: "+",
    warning: "!",
    error: "x",
    active: "*",
    skip: "-",
    line: "-",
  },
  indent: 2,
  showTimestamp: false,
  prefix: "",
  useBoxes: false,
};

/**
 * Vibrant theme — the default palette + bold accent on info / success /
 * warning / error levels. Ships as a preset for teams that want an
 * unambiguously loud CLI.
 */
export const VIBRANT_THEME: IConsoleTheme = {
  palette: {
    ...DEFAULT_PALETTE,
    info: (s: string): string => pc.bold(pc.cyan(s)),
    success: (s: string): string => pc.bold(pc.green(s)),
    warning: (s: string): string => pc.bold(pc.yellow(s)),
    error: (s: string): string => pc.bold(pc.red(s)),
  },
  icons: DEFAULT_ICONS,
  indent: 2,
  showTimestamp: true,
  prefix: "",
  useBoxes: true,
};
