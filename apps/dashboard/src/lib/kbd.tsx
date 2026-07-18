/**
 * @file kbd.tsx
 * @module lib/kbd
 *
 * @description
 * Shared renderers around HeroUI's `<Kbd>` compound. Every keyboard-shortcut
 * chip in the app — sidebar rows, command palette items, dropdown menus,
 * toolbar buttons — routes through here so the visual weight, tabular
 * digits, and modifier-vs-content split stay consistent.
 *
 * ## Why the compound and not a raw `<span>`
 * HeroUI's `Kbd.Abbr` reads its `keyValue` prop and picks the platform-
 * correct glyph (⌘/⌥/⇧/⌃ on mac, Ctrl/Alt/Shift elsewhere), so a shortcut
 * string like `"Cmd+K"` renders as `⌘K` on macOS and `Ctrl+K` on Windows
 * without any conditional wiring at the call site. `Kbd.Content` wraps the
 * "quiet" tokens (letters, digits, dot) so the compound can style each key
 * with the correct min-width + tabular-nums.
 *
 * The public entry point is {@link ShortcutKbd}; the internals ({@link
 * splitShortcut}, {@link toKbdChildren}) are exported for tests only.
 */

import { Kbd } from "@heroui/react";

import type { KbdKey } from "@heroui/react";
import type { ReactNode } from "react";

/**
 * Aliases the app-level shortcut vocabulary onto HeroUI's canonical
 * `KbdKey` union. Anything outside this map falls through as plain
 * `Kbd.Content` so an unrecognised token (e.g. a punctuation glyph)
 * still renders instead of crashing the compound.
 *
 * HeroUI's `KbdKey` includes: `command`, `shift`, `ctrl`, `option`,
 * `enter`, `delete`, `escape`, `tab`, `capslock`, `up`, `right`,
 * `down`, `left`, `pageup`, `pagedown`, `home`, `end`, `help`,
 * `space`, `fn`, `win`, `alt`. Any string we can't map to that set
 * short-circuits to Kbd.Content.
 */
const KEY_VALUE_ALIASES: Record<string, KbdKey> = {
  // Modifiers — the same modifier reads as different glyphs per OS
  // (⌘ vs Ctrl) via HeroUI's own OS-aware rendering.
  cmd: "command",
  command: "command",
  meta: "command",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "option",
  shift: "shift",
  // Navigation / semantic keys — mapped to the closest KbdKey
  enter: "enter",
  return: "enter",
  esc: "escape",
  escape: "escape",
  tab: "tab",
  backspace: "delete",
  delete: "delete",
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  space: "space",
  pageup: "pageup",
  pagedown: "pagedown",
  home: "home",
  end: "end",
};

/**
 * Split a shortcut sequence into `["chord", "chord", …]`. Each chord is a
 * `+`-separated list of key tokens (e.g. `"Cmd+Shift+K"`); sequential
 * chords are separated by a single space (leader keys like `"G A"`).
 *
 * Exported so the palette + shortcut sheet can share the same tokenisation
 * (and so unit tests can assert against the intermediate representation
 * without pulling in the Kbd DOM tree).
 */
export function splitShortcut(shortcut: string): string[][] {
  return shortcut
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((chord) =>
      chord
        .split("+")
        .map((key) => key.trim())
        .filter(Boolean),
    );
}

/**
 * True when the token names a modifier / semantic key that `Kbd.Abbr`
 * knows how to render. Non-modifier tokens (letters, digits, punctuation)
 * flow through `Kbd.Content`.
 */
function toKeyValue(token: string): KbdKey | undefined {
  return KEY_VALUE_ALIASES[token.toLowerCase()];
}

/**
 * Convert a parsed shortcut into a flat list of `Kbd` children (a mix of
 * `<Kbd.Abbr>` for modifiers and `<Kbd.Content>` for letters). Multi-chord
 * sequences (e.g. `"G A"`) get a plain `" "` between chords so the space
 * survives the Kbd layout — no non-breaking space needed, the compound
 * keeps its own gap.
 */
export function toKbdChildren(shortcut: string): ReactNode[] {
  const chords = splitShortcut(shortcut);
  const out: ReactNode[] = [];

  chords.forEach((chord, chordIndex) => {
    if (chordIndex > 0) {
      // WHY a bare space: `Kbd` gaps its children horizontally, but a two-
      // key leader sequence (G A) reads better with a literal space between
      // chords than with the default gap. The Kbd style resets the space's
      // width when the container is `tabular-nums`, so this stays crisp.
      out.push(<span key={`sep-${chordIndex}`}> </span>);
    }

    chord.forEach((token, tokenIndex) => {
      const keyValue = toKeyValue(token);

      if (keyValue) {
        out.push(<Kbd.Abbr key={`abbr-${chordIndex}-${tokenIndex}`} keyValue={keyValue} />);
      } else {
        out.push(
          <Kbd.Content key={`content-${chordIndex}-${tokenIndex}`}>
            {token.length === 1 ? token.toUpperCase() : token}
          </Kbd.Content>,
        );
      }
    });
  });

  return out;
}

/**
 * Props for {@link ShortcutKbd}. `shortcut` is required; `className` is
 * merged into the Kbd root so callers can size it (`ms-auto`, extra
 * tracking) without wrapping the compound in another element.
 */
export interface ShortcutKbdProps {
  /** Shortcut sequence (e.g. `"Cmd+K"`, `"G A"`, `"?"`). */
  shortcut: string;
  /** Optional class merged onto the `<Kbd>` root. */
  className?: string;
}

/**
 * Render a shortcut string as a real HeroUI `<Kbd>` chip with the compound
 * splits (`Kbd.Abbr` for modifiers, `Kbd.Content` for letters). Callers
 * that need a specific visual weight (`text-[10px]`, `ms-auto`) can pass
 * through `className`.
 *
 * @example
 * <ShortcutKbd shortcut="Cmd+K" />       // ⌘K
 * <ShortcutKbd shortcut="G A" />          // G · A
 * <ShortcutKbd shortcut="?" />            // ?
 */
export function ShortcutKbd({ shortcut, className }: ShortcutKbdProps): ReactNode {
  return (
    <Kbd className={["text-[10px] tabular-nums", className].filter(Boolean).join(" ")}>
      {toKbdChildren(shortcut)}
    </Kbd>
  );
}
