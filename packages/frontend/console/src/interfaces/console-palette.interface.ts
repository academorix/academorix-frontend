/**
 * @file console-palette.interface.ts
 * @module @stackra/console/interfaces
 * @description Colour palette applied to every styled console output. Each
 *   entry is a `ColorFn` — a `picocolors`-compatible function that wraps a
 *   string in ANSI escape codes. Consumers override individual entries to
 *   brand the CLI without replacing the whole palette.
 */

import type { ColorFn } from "./banner-options.interface";

/**
 * The console colour palette. Every entry is a `ColorFn` — a function that
 * takes a plain string and returns the same string wrapped in ANSI escape
 * codes. Missing entries fall back to the identity function (no styling).
 */
export interface IConsolePalette {
  /** Primary brand colour — headers, banner, key highlights. */
  primary: ColorFn;
  /** Accent colour — table headers, secondary emphasis. */
  accent: ColorFn;
  /** Semantic banner colour — the intro / outro pill background. */
  banner: ColorFn;
  /** Muted colour — timestamps, dimmed hints, outro text. */
  muted: ColorFn;
  /** Info level messages. */
  info: ColorFn;
  /** Success level messages. */
  success: ColorFn;
  /** Warning level messages. */
  warning: ColorFn;
  /** Error level messages. */
  error: ColorFn;
  /** Label styling for key-value pairs + form field labels. */
  label: ColorFn;
  /** Value styling for key-value pairs. */
  value: ColorFn;
  /** Border colour — separators, table borders, panel edges. */
  border: ColorFn;
  /** URL colour — clickable links, path references. */
  url: ColorFn;
  /** Highlight colour — percentage badges, progress bar labels. */
  highlight: ColorFn;
}
