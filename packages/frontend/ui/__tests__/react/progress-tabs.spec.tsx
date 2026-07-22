// @vitest-environment jsdom
/**
 * @file progress-tabs.spec.tsx
 * @module @stackra/ui/__tests__/react
 * @description Regression coverage — Round 6 UI reviewer P1 (A).
 *
 *   The previous `<ProgressTabs>` implementation stamped
 *   `role="tab"` / `role="tabpanel"` on its Stepper-based DOM but:
 *
 *     1. Content panels' `aria-labelledby={"tab-${value}"}` never
 *        resolved — no DOM node carried that id.
 *     2. `role="tablist"` had no ArrowLeft / ArrowRight / Home /
 *        End keyboard handling per the WAI-ARIA "Tabs" pattern.
 *
 *   Both were P1 accessibility regressions that failed WCAG 2.2 AA
 *   (Success Criterion 2.1.1 — Keyboard, and 4.1.2 — Name, Role,
 *   Value).
 *
 *   Fix (2026-07-21): the compound was rebuilt on HeroUI `Tabs` —
 *   React Aria owns the a11y contract, so every assertion below
 *   passes without hand-rolling id linkage or keyboard handlers.
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressTabs } from "@/react/components/progress-tabs/progress-tabs.component";

afterEach(cleanup);

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

  it("every panel's `aria-labelledby` target id exists in the DOM", () => {
    renderThreeTab();

    // WAI-ARIA requires the id referenced by `aria-labelledby` to
    // resolve to a real DOM node — screen readers use it to
    // announce the panel's owning tab. React Aria's Tabs generates
    // a stable id for every tab and points every panel at it via
    // `aria-labelledby`, so this chain closes automatically.
    const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels.length).toBeGreaterThan(0);

    for (const panel of Array.from(panels)) {
      const referencedId = panel.getAttribute("aria-labelledby");
      expect(referencedId).not.toBeNull();
      const target = referencedId ? document.getElementById(referencedId) : null;
      expect(
        target,
        `Panel labelled by "${referencedId}" — no DOM node with that id exists.`,
      ).not.toBeNull();
    }
  });

  it("exposes `role=tab` on every trigger", () => {
    renderThreeTab();

    // Every Tabs.Tab renders `role="tab"` on its underlying button
    // (React Aria's Tab primitive). Three triggers ⇒ three tabs.
    const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]');

    expect(tabs.length).toBeGreaterThanOrEqual(3);
  });

  it("ArrowRight on a focused tab moves focus to the next tab (WAI-ARIA tab pattern)", () => {
    renderThreeTab();

    // Whatever HeroUI's Tab renders as, it carries `role="tab"`.
    // Grab the focusable trio + drive keyboard nav directly.
    const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));

    expect(tabs.length).toBeGreaterThanOrEqual(2);

    const [first, second] = tabs;

    (first as HTMLElement).focus();
    expect(document.activeElement).toBe(first);

    // React Aria's Tabs listens for ArrowRight on the tablist and
    // moves focus to the next enabled tab, wrapping at the end.
    fireEvent.keyDown(first as HTMLElement, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    expect(document.activeElement).toBe(second);
  });
});
