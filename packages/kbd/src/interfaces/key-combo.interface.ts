/**
 * @fileoverview KeyCombo — declarative keyboard combination.
 *
 * Combos cover three patterns:
 * 1. **Single keystroke** — `{ key: "escape" }` or `{ mod: true, key: "k" }`.
 * 2. **Vim-style chord sequence** — `{ sequence: ["g", "h"] }`.
 * 3. **Per-platform sequences** — `{ keys: { mac: ["g", "h"], windows: ["g", "h"] } }`
 *    when an app needs different bindings per OS.
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

/**
 * Modifier flags supported by {@link KeyCombo}.
 *
 * `mod` is the platform-aware "primary" modifier — Cmd on macOS,
 * Ctrl on Windows / Linux. Prefer `mod` over hard-coding `meta` /
 * `ctrl` so shortcuts work everywhere.
 */
export interface KeyComboModifiers {
  /** Platform-aware primary modifier (Cmd on Mac, Ctrl elsewhere). */
  mod?: boolean;
  /** Force the Ctrl key explicitly. */
  ctrl?: boolean;
  /** Force the Cmd / Meta key explicitly. */
  meta?: boolean;
  /** Alt / Option. */
  alt?: boolean;
  /** Shift. */
  shift?: boolean;
}

/**
 * Per-platform sequence map — used for shortcuts that intentionally
 * differ between operating systems. The runtime picks the entry that
 * matches the active platform; falls back to the first non-empty value
 * when the platform key is missing.
 */
export interface PlatformKeys {
  mac?: string[];
  windows?: string[];
  linux?: string[];
}

/**
 * Declarative keyboard combination.
 *
 * @example
 * ```typescript
 * { mod: true, key: "k" }                          // Cmd/Ctrl + K
 * { sequence: ["g", "h"] }                         // Vim chord
 * { keys: { mac: ["g", "p"], linux: ["g", "p"] } } // per-platform chord
 * { mod: true, shift: true, key: "p" }             // Cmd/Ctrl + Shift + P
 * ```
 */
export interface KeyCombo extends KeyComboModifiers {
  /** Single key in lowercase (e.g. `"k"`, `"escape"`, `"/"`). */
  key?: string;

  /** Chord sequence — keys pressed in order, with a configurable timeout between presses. */
  sequence?: string[];

  /** Per-platform sequence overrides. When present, overrides `sequence`. */
  keys?: PlatformKeys;
}
