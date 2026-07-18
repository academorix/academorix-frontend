/**
 * @file console-icons.interface.ts
 * @module @stackra/console/interfaces
 * @description Icon / glyph set used across styled console output. Kept as
 *   plain strings so themes can swap ASCII fallbacks for Unicode glyphs (or
 *   the other way round) without touching consumer code.
 */

/**
 * Icon glyph set the theme uses across log lines, lists, separators,
 * spinners, and progress indicators. Every entry is a short string
 * (typically 1-2 characters) that renders in place of a semantic role.
 */
export interface IConsoleIcons {
  /** Arrow prefix for step / action messages (e.g. `"→"`, `">"`). */
  arrow: string;
  /** Bullet prefix for default lists (e.g. `"•"`, `"-"`). */
  bullet: string;
  /** Pointer prefix for the current selection (e.g. `"▶"`, `">"`). */
  pointer: string;
  /** Info level glyph (e.g. `"ℹ"`, `"i"`). */
  info: string;
  /** Success level glyph (e.g. `"✔"`, `"OK"`). */
  success: string;
  /** Warning level glyph (e.g. `"⚠"`, `"!"`). */
  warning: string;
  /** Error level glyph (e.g. `"✖"`, `"X"`). */
  error: string;
  /** Active / running glyph for spinners in non-TTY fallback. */
  active: string;
  /** Skip glyph for skipped tasks / commands. */
  skip: string;
  /** Line character for separators (e.g. `"─"`, `"-"`). */
  line: string;
}
