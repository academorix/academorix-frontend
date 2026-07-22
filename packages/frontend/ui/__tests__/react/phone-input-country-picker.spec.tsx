// @vitest-environment jsdom
/**
 * @file phone-input-country-picker.spec.tsx
 * @module @stackra/ui/__tests__/react
 * @description Regression coverage — Round 6 UI reviewer P1.
 *
 *   The country prefix in `phone-input.component.tsx` used to
 *   render a `<Button>` with an accessible name but NO `onPress`
 *   handler — a dead interactive control. Screen readers announced
 *   the trigger, keyboard users could focus + activate it, and
 *   nothing happened. The declared `useCallback` for country
 *   change was assigned to no consumer ("reserved for future
 *   picker implementation").
 *
 *   Two knock-on P1 accessibility problems:
 *
 *     1. `aria-haspopup` / `aria-expanded` — missing. Screen
 *        readers announced the trigger as a normal button with no
 *        popup relationship.
 *     2. Keyboard activation was a no-op.
 *
 *   Fix (2026-07-21): the trigger now sits inside a HeroUI
 *   `Popover`. React Aria's `DialogTrigger` (Popover's underlying
 *   primitive) stamps `aria-haspopup="dialog"` and flips
 *   `aria-expanded` when the popover opens. A `ListBox` inside
 *   the popover lists every country from `DEFAULT_COUNTRIES` and
 *   its `onSelectionChange` fires the country-change handler,
 *   which propagates through `onChange` to the caller.
 *
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhoneInput } from "@/react/components/phone-input/phone-input.component";

afterEach(cleanup);

describe("<PhoneInput> — country picker interactivity", () => {
  it("pressing the country trigger opens the country picker popup", () => {
    const onChange = vi.fn();

    render(<PhoneInput value="" onChange={onChange} defaultCountry="US" />);

    const trigger = screen.getByRole("button", {
      name: /Selected country: US, \+1/,
    });
    expect(trigger).toBeDefined();

    // Fire a click — React Aria's Button wires both mouse and
    // keyboard activation through the same press event.
    fireEvent.click(trigger);

    // After opening the popover React Aria updates
    // `aria-expanded` on the trigger AND renders the ListBox in a
    // portal (`role="listbox"`). Either of those observable
    // changes counts as "the picker opened".
    const popupOpened =
      trigger.getAttribute("aria-expanded") === "true" ||
      document.querySelector('[role="listbox"]') !== null;

    expect(popupOpened).toBe(true);
  });

  it("the country trigger declares a popup relationship for screen readers", () => {
    render(<PhoneInput defaultCountry="US" />);

    const trigger = screen.getByRole("button", {
      name: /Selected country: US, \+1/,
    });

    // WAI-ARIA disclosure pattern — the trigger MUST expose the
    // popup relationship. React Aria's Popover stamps
    // `aria-expanded` on the trigger from mount (false when
    // closed, true when open) which satisfies the pattern, and
    // wires `aria-controls` to the dialog id once the user opens
    // the popover. Assert either signal is present — the exact
    // attribute is a HeroUI/React Aria implementation detail, but
    // AT LEAST ONE is required for screen-reader users to hear
    // "popup button".
    fireEvent.click(trigger);

    const hasPopup = trigger.getAttribute("aria-haspopup");
    const expanded = trigger.getAttribute("aria-expanded");
    const controls = trigger.getAttribute("aria-controls");

    const declaresPopupRelationship = hasPopup !== null || expanded !== null || controls !== null;

    expect(declaresPopupRelationship).toBe(true);
  });

  it("pressing the country trigger toggles `aria-expanded`", () => {
    render(<PhoneInput defaultCountry="US" />);

    const trigger = screen.getByRole("button", {
      name: /Selected country: US, \+1/,
    });

    fireEvent.click(trigger);

    // After activation, aria-expanded flips to "true" — the
    // canonical popup-state signal for screen readers.
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
