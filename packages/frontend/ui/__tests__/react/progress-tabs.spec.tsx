// @vitest-environment jsdom
/**
 * @file progress-tabs.spec.tsx
 * @module @stackra/ui/__tests__/react
 * @description REGRESSION test — Round 6 UI reviewer finding P1 (A).
 *
 *   `progress-tabs.component.tsx` stamps `role="tab"` on every
 *   trigger and `role="tabpanel"` with `aria-labelledby={`tab-${value}`}`
 *   on every content panel, but:
 *
 *     1. The triggers have no matching `id="tab-<value>"` attribute
 *        — so `aria-labelledby` dangles. Screen readers cannot resolve
 *        the panel's programmatic label to its owning tab.
 *     2. `ProgressTabsList` renders a bare `role="tablist"` around
 *        HeroUI Pro's `Stepper` — there is no ArrowLeft / ArrowRight
 *        / Home / End key handling per WAI-ARIA Authoring Practices
 *        for tabs.
 *
 *   Both are P1 accessibility regressions that fail WCAG 2.2 AA
 *   (Success Criterion 2.1.1 — Keyboard, and 4.1.2 — Name, Role,
 *   Value).
 *
 *   Fix suggested by the UI reviewer report:
 *   - Stamp `id="tab-<value>"` on every trigger DOM node.
 *   - Wire ArrowLeft / ArrowRight (Home / End) on `role="tablist"`
 *     to move focus among the triggers, per the WAI-ARIA authoring
 *     practices "Tabs with automatic activation" pattern.
 *   - See
 *     `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *     §"P1 findings > progress-tabs".
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressTabs } from "@/react/components/progress-tabs/progress-tabs.component";

afterEach(cleanup);

// REGRESSION — Round 6 UI reviewer P1 (A). Fix by stamping
// `id="tab-<value>"` on every trigger + wiring ArrowLeft/ArrowRight
// keyboard nav on the `role="tablist"` node per the WAI-ARIA tab pattern.

describe("<ProgressTabs> — WAI-ARIA tab pattern", () => {
  /**
   * Render a canonical three-tab compound so every assertion below
   * shares the same shape. Uncontrolled — the internal state flips
   * when the user activates a trigger.
   */
  function renderThreeTab(): void {
    render(
      <ProgressTabs defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="organize">Organize</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="review">Review</ProgressTabs.Trigger>
        </ProgressTabs.List>
        <ProgressTabs.Content value="details">
          <span data-testid="details-panel">details</span>
        </ProgressTabs.Content>
        <ProgressTabs.Content value="organize">
          <span data-testid="organize-panel">organize</span>
        </ProgressTabs.Content>
        <ProgressTabs.Content value="review">
          <span data-testid="review-panel">review</span>
        </ProgressTabs.Content>
      </ProgressTabs>,
    );
  }

  it.fails("REGRESSION — every panel's `aria-labelledby` target id exists in the DOM", () => {
    renderThreeTab();

    // The content panels reference `tab-<value>` via aria-labelledby.
    // WAI-ARIA requires the referenced id to exist on a real DOM
    // node — screen readers use it to announce the panel's owning
    // tab.
    const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels.length).toBeGreaterThan(0);

    for (const panel of Array.from(panels)) {
      const referencedId = panel.getAttribute("aria-labelledby");
      expect(referencedId).not.toBeNull();
      // The referenced id must resolve to a real DOM node —
      // aria-labelledby is a required navigation contract for
      // screen readers.
      const target = referencedId ? document.getElementById(referencedId) : null;
      expect(
        target,
        `Panel labelled by "${referencedId}" — no DOM node with that id exists. ` +
          "Trigger must stamp `id=tab-<value>` to close the aria-labelledby chain.",
      ).not.toBeNull();
    }
  });

  it.fails(
    "REGRESSION — `role=tab` elements are exposed on every trigger (screen readers rely on it)",
    () => {
      renderThreeTab();

      // Query permissively — a Stepper.Step may render as <li>, <button>,
      // or a bespoke shape. The regression is that NONE of them carry
      // `role="tab"`, so a screen reader in tab-navigation mode sees an
      // empty tab list.
      const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]');

      // Today: 0 elements have role="tab" — the Stepper renders <li>
      // items with no explicit role. This assertion documents the
      // regression.
      expect(tabs.length).toBeGreaterThanOrEqual(3);
    },
  );

  it.fails(
    "REGRESSION — ArrowRight on a focused tab moves focus to the next tab (WAI-ARIA tab pattern)",
    () => {
      renderThreeTab();

      // Whatever the triggers render as (button, li, div), we look
      // up focusable candidates that carry `role="tab"`. If the
      // regression is fixed, this yields the trigger buttons.
      const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));

      // Guard: if the role="tab" markup is missing, this assertion
      // fails clearly — no need to run the ArrowRight simulation on
      // a phantom element.
      expect(tabs.length).toBeGreaterThanOrEqual(2);

      const [first, second] = tabs;

      // Simulate the user tabbing to the first trigger + pressing
      // ArrowRight. WAI-ARIA "Tabs with automatic activation" says
      // focus should advance to the second tab.
      (first as HTMLElement).focus();
      expect(document.activeElement).toBe(first);

      fireEvent.keyDown(first as HTMLElement, {
        key: "ArrowRight",
        code: "ArrowRight",
      });

      // Today the tablist has no ArrowRight handler — focus stays on
      // the first tab. This assertion documents the missing behavior.
      expect(document.activeElement).toBe(second);
    },
  );
});
