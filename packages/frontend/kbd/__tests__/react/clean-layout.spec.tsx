// @vitest-environment jsdom
/**
 * @file clean-layout.spec.tsx
 * @module @stackra/kbd/__tests__/react
 * @description Regression coverage — Round 6 UI reviewer P1.
 *
 *   `packages/frontend/kbd/src/components/command-palette/layouts/`
 *   `clean.layout.tsx` used to render breadcrumb chips as
 *   `<Chip onClick=...>`. Three compounding a11y bugs:
 *
 *     1. HeroUI `Chip` has no documented `onClick` prop — a
 *        contract violation that could break under any release.
 *     2. `Chip` renders a decorative `<span>` / `<div>` — no
 *        `role="button"`, no keyboard support, no tabindex.
 *     3. Enter / Space on a focused chip did nothing.
 *
 *   Both compound WCAG 2.2 AA Success Criteria: 2.1.1 (Keyboard)
 *   and 4.1.2 (Name, Role, Value).
 *
 *   Fix (2026-07-21): the chip pattern was replaced with a HeroUI
 *   `<Button variant="tertiary" size="sm" onPress={...}>`. Button
 *   renders as `<button>` with a real role, tabindex, keyboard
 *   activation, and accessible name from its children.
 *
 *   The spec renders the fixed pattern in isolation — the full
 *   `CleanPaletteLayout` depends on i18n + DI + HeroUI Command
 *   state, and this regression is at the pattern level, not the
 *   layout wiring level.
 *
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@stackra/ui/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

/**
 * Repro of the fixed breadcrumb pattern from `clean.layout.tsx`.
 *
 * Mirrors the layout's real render: same variant / size, same
 * handler wiring. `<Button>` provides `role="button"`, keyboard
 * activation, and focus semantics natively.
 */
function CleanBreadcrumbRepro({
  page,
  onClear,
}: {
  page: string;
  onClear: () => void;
}): React.ReactElement {
  return (
    <Button size="sm" variant="tertiary" onPress={onClear}>
      {page}
    </Button>
  );
}

describe("kbd clean layout — breadcrumb button accessibility", () => {
  it("the breadcrumb button is queryable via `getByRole('button')`", () => {
    render(<CleanBreadcrumbRepro page="settings" onClear={() => undefined} />);

    // `<Button>` renders a real `<button>` — screen readers and
    // keyboard users can find + operate it without any custom
    // ARIA scaffolding.
    expect(() => screen.getByRole("button", { name: /settings/i })).not.toThrow();
  });

  it("pressing Enter on a focused breadcrumb button fires the clear handler", () => {
    const onClear = vi.fn();

    render(<CleanBreadcrumbRepro page="settings" onClear={onClear} />);

    const button = screen.getByRole("button", { name: /settings/i });

    // Focus + press Enter — the standard keyboard-activation
    // path for a button. React Aria's Button hooks up Enter and
    // Space activation on `<button>` elements, so onPress fires
    // just like a mouse click.
    button.focus();
    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(button, { key: "Enter", code: "Enter" });

    expect(onClear).toHaveBeenCalledOnce();
  });

  it("the breadcrumb button is keyboard-focusable (tabIndex not -1)", () => {
    render(<CleanBreadcrumbRepro page="settings" onClear={() => undefined} />);

    const button = screen.getByRole("button", { name: /settings/i });

    // Native `<button>` elements are keyboard-focusable by default
    // — either `tabindex` is absent (implicit 0) or explicitly `0`.
    // The regression was that `Chip` rendered as `<span>` with no
    // tabindex, skipping it in the tab order entirely.
    const tabIndexAttr = button.getAttribute("tabindex") ?? button.getAttribute("tabIndex");
    const tabIndexValue = tabIndexAttr === null ? 0 : Number(tabIndexAttr);

    expect(tabIndexValue).not.toBe(-1);
  });
});
