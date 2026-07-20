/**
 * @fileoverview KeyboardShortcut — renders a KeyCombo as a HeroUI Kbd chip.
 *
 * Pure presentational component — useful in menus, command palettes,
 * tooltips, and the help overlay. Sequences (e.g. `g h`) render with a
 * faint dot separator instead of a literal space, which reads better
 * at small sizes.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { Fragment, type ReactElement } from "react";
import { Kbd } from "@stackra/ui/react";
import { Str } from "@stackra/support";

import type { KeyboardShortcutProps } from "../../interfaces/keyboard-shortcut-props.interface";
import type { KeyCombo } from "../../interfaces/key-combo.interface";
import { isMac } from "../../utils/is-mac.util";
import { resolveSequence } from "../../utils/resolve-sequence.util";

/**
 * Render a {@link KeyCombo} as a sequence of HeroUI `<Kbd>` chips.
 *
 * Sequence combos (`{ sequence: ["g", "h"] }`) render as `G · H` — a
 * faint mid-dot separates the two presses. Modifier-based combos
 * (`{ mod: true, key: "k" }`) render with the platform-appropriate
 * abbreviations (`⌘K` on macOS, `Ctrl K` elsewhere).
 */
export function KeyboardShortcut({ combo, className }: KeyboardShortcutProps): ReactElement {
  const sequence = resolveSequence(combo);
  if (sequence) {
    return (
      <Kbd className={className}>
        {sequence.map((key, i) => (
          <Fragment key={`${key}-${i}`}>
            {i > 0 && (
              <span aria-hidden="true" className="text-default-400 mx-1">
                ·
              </span>
            )}
            <Kbd.Content>{Str.upper(key)}</Kbd.Content>
          </Fragment>
        ))}
      </Kbd>
    );
  }

  const mac = isMac();
  return (
    <Kbd className={className}>
      {(combo.mod || combo.meta) && <Kbd.Abbr keyValue={mac ? "command" : "ctrl"} />}
      {combo.ctrl && !combo.mod && <Kbd.Abbr keyValue="ctrl" />}
      {combo.alt && <Kbd.Abbr keyValue={mac ? "option" : "alt"} />}
      {combo.shift && <Kbd.Abbr keyValue="shift" />}
      {combo.key && <Kbd.Content>{Str.upper(combo.key)}</Kbd.Content>}
    </Kbd>
  );
}
