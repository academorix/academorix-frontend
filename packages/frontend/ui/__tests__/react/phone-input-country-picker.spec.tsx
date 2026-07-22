// @vitest-environment jsdom
/**
 * @file phone-input-country-picker.spec.tsx
 * @module @stackra/ui/__tests__/react
 * @description REGRESSION test — Round 6 UI reviewer finding P1.
 *
 *   `phone-input.component.tsx:219-235` renders a HeroUI `<Button>`
 *   for the country flag + dial-code prefix (`Selected country: US,
 *   +1`) — but the button has NO `onPress` handler wired. The
 *   trigger looks interactive (has cursor + hover styles + an
 *   accessible name), but pressing it does nothing.
 *
 *   Worse, the component's own source (`phone-input.component.tsx`)
 *   documents the intent: the `useCallback` for country change is
 *   built and immediately abandoned ("reserved for future picker
 *   implementation"). The country picker is dead code — pressing
 *   the button never opens a picker.
 *
 *   Two knock-on P1 accessibility problems:
 *
 *     1. `aria-haspopup="listbox"` (or `aria-expanded`) — missing.
 *        Screen readers announce the trigger as a normal button
 *        with no popup relationship.
 *     2. Keyboard activation is a no-op. Focus lands, Enter fires
 *        no state change. Users cannot change the country without
 *        the developer manually setting `defaultCountry`.
 *
 *   Fix suggested by the UI reviewer report:
 *   Either
 *     (a) Land the picker — a HeroUI `Popover` + `ListBox` compound
 *         whose `onPress` opens the popup, whose `onSelectionChange`
 *         updates `selectedCountry`, and whose trigger stamps
 *         `aria-haspopup="listbox"` + `aria-expanded`; OR
 *     (b) Downgrade the trigger to the static-prefix shape used
 *         when `disableDropdown={true}`, removing the misleading
 *         interactive affordance.
 *
 *   See `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *   §"P1 findings > phone-input country picker".
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhoneInput } from "@/react/components/phone-input/phone-input.component";

afterEach(cleanup);

// REGRESSION — Round 6 UI reviewer P1. Fix by either landing the
// country picker OR downgrading the dropdown trigger to the static
// non-interactive prefix.

describe("<PhoneInput> — country picker interactivity", () => {
  it.fails(
    "REGRESSION — the country trigger button has an onPress handler " +
      "(currently a no-op; picker is not implemented)",
    () => {
      // We can't inspect the React prop directly without touching
      // React internals — instead we test the observable
      // behaviour: pressing the trigger should cause SOMETHING to
      // change (a menu opens, aria-expanded flips, selectedCountry
      // updates via onChange). Today: nothing happens.
      const onChange = vi.fn();
      render(<PhoneInput value="" onChange={onChange} defaultCountry="US" />);

      const trigger = screen.getByRole("button", {
        name: /Selected country: US, \+1/,
      });
      expect(trigger).toBeDefined();

      // Trigger a press using both events — a real button with
      // `onPress` responds to both mouse and keyboard.
      fireEvent.click(trigger);
      fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(trigger, { key: "Enter", code: "Enter" });

      // Expect SOMETHING happened. Either the trigger opens a
      // popup (aria-expanded flips), OR the phone-input surface
      // registers a country change through onChange (with a new
      // country in the info payload). Today: neither.
      const popupOpened =
        trigger.getAttribute("aria-expanded") === "true" ||
        document.querySelector('[role="listbox"]') !== null ||
        document.querySelector('[role="menu"]') !== null;

      expect(
        popupOpened || onChange.mock.calls.length > 0,
        "Pressing the country trigger must open a picker OR trigger onChange. " +
          "Today the button has no `onPress` handler — the picker is dead code.",
      ).toBe(true);
    },
  );

  it.fails(
    "REGRESSION — the country trigger declares `aria-haspopup` so screen readers " +
      "announce the popup relationship",
    () => {
      render(<PhoneInput defaultCountry="US" />);

      const trigger = screen.getByRole("button", {
        name: /Selected country: US, \+1/,
      });

      // WAI-ARIA — a trigger that opens a listbox / menu / dialog
      // must declare `aria-haspopup` so assistive tech announces
      // "US, plus one — popup button".
      const hasPopup = trigger.getAttribute("aria-haspopup");
      expect(
        hasPopup,
        "The country trigger must declare aria-haspopup (`listbox` or `menu`) so " +
          "screen readers announce the popup relationship.",
      ).not.toBeNull();
    },
  );

  it.fails("REGRESSION — pressing the country trigger toggles `aria-expanded`", () => {
    render(<PhoneInput defaultCountry="US" />);

    const trigger = screen.getByRole("button", {
      name: /Selected country: US, \+1/,
    });

    // Before press — must expose the expandable state (either
    // `false` or absent-if-collapsed).
    const before = trigger.getAttribute("aria-expanded");

    fireEvent.click(trigger);

    const after = trigger.getAttribute("aria-expanded");

    // If the trigger really opens a popup, aria-expanded must
    // flip to "true" on activation.
    expect(
      after,
      "Pressing the country trigger must flip aria-expanded to `true`. " +
        "Today the trigger is inert — the picker never opens.",
    ).toBe("true");

    // The `before` value doesn't matter — the reviewer's finding
    // is about the FLIP, not the initial state. Reference it here
    // so the linter doesn't warn on an unused const.
    void before;
  });
});
