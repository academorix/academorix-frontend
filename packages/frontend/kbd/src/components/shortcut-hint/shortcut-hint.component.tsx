/**
 * @fileoverview ShortcutHint — wraps an interactive element with a shortcut hint.
 *
 * The wrapped element is rendered as-is; when {@link KeyboardHints} is
 * toggled on, the overlay reads the `data-shortcut` attribute (or the
 * companion `<ShortcutHint>` JSX wrapper, which writes the same
 * attribute) and renders a Kbd chip near the element.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { Children, cloneElement, isValidElement, type ReactElement } from "react";

import type { ShortcutHintProps } from "../../interfaces/shortcut-hint-props.interface";

/**
 * Tag the child element with a `data-shortcut` attribute serialising
 * the combo so the {@link KeyboardHints} overlay can find it.
 *
 * Accepts exactly one child — apps wrap individual buttons / links
 * with this component to opt them into the hints overlay.
 *
 * @example
 * ```tsx
 * <ShortcutHint combo={{ mod: true, key: "s" }} description={t("kbd.components.shortcut_hint.save")}>
 *   <Button onPress={save}>{t("kbd.components.shortcut_hint.save")}</Button>
 * </ShortcutHint>
 * ```
 */
export function ShortcutHint({ combo, children, description }: ShortcutHintProps): ReactElement {
  const child = Children.only(children);
  if (!isValidElement(child)) return child;

  const serialized = JSON.stringify(combo);
  return cloneElement(child as ReactElement<Record<string, unknown>>, {
    "data-shortcut": serialized,
    "data-shortcut-description": description,
  });
}
