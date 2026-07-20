/**
 * @fileoverview KeyboardHints — floating overlay annotating shortcut elements.
 *
 * When toggled on (via {@link KeyboardHintsService}), this component
 * scans the document for elements bearing `data-shortcut="<json>"` and
 * paints a small Kbd chip overlay next to each. Apps mark elements
 * either by setting the attribute manually or by wrapping them in
 * `<ShortcutHint>`.
 *
 * The overlay uses a single fixed-positioned root and a ResizeObserver
 * + scroll listener to keep chips aligned with their target.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { useEffect, useState, type ReactElement } from "react";

import { useKeyboardHints } from "../../hooks/use-keyboard-hints/use-keyboard-hints.hook";
import type { KeyCombo } from "../../interfaces/key-combo.interface";

import { KeyboardShortcut } from "./../keyboard-shortcut/keyboard-shortcut.component";

/**
 * Single hint position.
 */
interface HintBox {
  id: string;
  combo: KeyCombo;
  rect: DOMRect;
}

/**
 * Floating hints overlay.
 */
export function KeyboardHints(): ReactElement | null {
  const { visible } = useKeyboardHints();
  const [boxes, setBoxes] = useState<HintBox[]>([]);

  useEffect(() => {
    if (!visible) {
      setBoxes([]);
      return;
    }

    const measure = (): void => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-shortcut]"));
      const next: HintBox[] = [];
      for (const el of elements) {
        const raw = el.getAttribute("data-shortcut");
        if (!raw) continue;
        let combo: KeyCombo;
        try {
          combo = JSON.parse(raw) as KeyCombo;
        } catch {
          continue;
        }
        next.push({ id: getId(el), combo, rect: el.getBoundingClientRect() });
      }
      setBoxes(next);
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const observer = new MutationObserver(measure);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer.disconnect();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-9999" aria-hidden="true">
      {boxes.map((box) => (
        <div
          key={box.id}
          className="absolute"
          style={{
            top: Math.max(0, box.rect.top - 4),
            left: Math.max(0, box.rect.right - 8),
            transform: "translateY(-100%)",
          }}
        >
          <KeyboardShortcut combo={box.combo} />
        </div>
      ))}
    </div>
  );
}

let counter = 0;

/**
 * Stable id for an element — synthesizes a `data-shortcut-id` when
 * the element doesn't already have one.
 */
function getId(el: HTMLElement): string {
  const existing = el.dataset.shortcutId;
  if (existing) return existing;
  const next = `kbd-hint-${counter++}`;
  el.dataset.shortcutId = next;
  return next;
}
