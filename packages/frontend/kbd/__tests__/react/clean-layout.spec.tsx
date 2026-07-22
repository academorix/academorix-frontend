// @vitest-environment jsdom
/**
 * @file clean-layout.spec.tsx
 * @module @stackra/kbd/__tests__/react
 * @description REGRESSION test — Round 6 UI reviewer finding P1.
 *
 *   `packages/frontend/kbd/src/components/command-palette/layouts/`
 *   `clean.layout.tsx` renders breadcrumb chips inside the palette
 *   header when nested pages are open:
 *
 *   ```tsx
 *   {pages.map((page) => (
 *     <Chip
 *       key={page}
 *       size="sm"
 *       variant="tertiary"
 *       className="cursor-pointer"
 *       onClick={() => setPages((p) => p.slice(0, p.indexOf(page) + 1))}
 *     >
 *       {page}
 *     </Chip>
 *   ))}
 *   ```
 *
 *   Three P1 accessibility bugs in that pattern:
 *
 *     1. **`Chip` has no documented `onClick` prop.** HeroUI's `Chip`
 *        is a decorative badge; adding `onClick` may fire (React
 *        forwards it to the underlying DOM node) but it is a
 *        contract violation — the next `@heroui/react` release can
 *        break it.
 *     2. **No `role="button"`.** The Chip renders as a decorative
 *        `<span>` / `<div>`. Screen readers announce it as static
 *        text — a keyboard-only user has no signal that it is
 *        interactive.
 *     3. **No keyboard activation.** Enter / Space on a focused
 *        Chip does nothing — there's no `onKeyDown` handler and no
 *        native button semantics.
 *
 *   Compound WCAG 2.2 AA failures: SC 2.1.1 (Keyboard) and 4.1.2
 *   (Name, Role, Value).
 *
 *   Fix suggested by the UI reviewer report:
 *   Wrap the Chip in a HeroUI `<Button variant="tertiary" size="sm"
 *   onPress={...}>` so the trigger gets `role="button"`, keyboard
 *   activation, and a native accessible name — OR replace the Chip
 *   pattern with a HeroUI `Breadcrumbs` compound (which handles
 *   this natively).
 *
 *   See `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *   §"P1 findings > kbd clean-layout Chip".
 *
 *   This spec renders the offending pattern in isolation — the full
 *   `CleanPaletteLayout` depends on i18n + DI + HeroUI Command
 *   state, and the reviewer's finding is at the pattern level, not
 *   the layout wiring level.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Chip } from "@stackra/ui/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// REGRESSION — Round 6 UI reviewer P1. Fix by replacing the
// `<Chip onClick>` pattern with `<Button onPress>` (or a HeroUI
// `Breadcrumbs` compound) — the Chip carries no button semantics.

/**
 * Repro of the breadcrumb pattern from `clean.layout.tsx:65`.
 *
 * Faithful to the layout's own source: same props, same handler
 * shape, same lack of `role` / `aria-label` / keyboard handler.
 */
function CleanBreadcrumbRepro({
  page,
  onClear,
}: {
  page: string;
  onClear: () => void;
}): React.ReactElement {
  return (
    <Chip
      size="sm"
      variant="tertiary"
      className="cursor-pointer"
      // The problematic pattern — Chip has no documented onClick,
      // no role="button", no keyboard support. Reviewers reject
      // this in code review; the layout still ships with it.
      onClick={onClear}
    >
      {page}
    </Chip>
  );
}

describe("kbd clean layout — breadcrumb Chip accessibility", () => {
  it.fails("REGRESSION — the breadcrumb chip is queryable via `getByRole('button')`", () => {
    render(<CleanBreadcrumbRepro page="settings" onClear={() => undefined} />);

    // The reviewer's expected behavior — the breadcrumb chip must
    // announce itself as a button so keyboard-only + screen reader
    // users can activate it.
    //
    // Today `Chip` renders as a `<span>` (or `<div>`); no matching
    // `role="button"` node exists. This assertion FAILS.
    expect(() => screen.getByRole("button", { name: /settings/i })).not.toThrow();
  });

  it.fails(
    "REGRESSION — pressing Enter on a focused breadcrumb chip fires the clear handler",
    () => {
      const onClear = vi.fn();
      render(<CleanBreadcrumbRepro page="settings" onClear={onClear} />);

      // The chip renders as a span — find it by its text content.
      const chip = screen.getByText("settings");

      // Focus + press Enter — the standard keyboard-activation
      // path for a button. Today the chip has no keydown handler,
      // so the callback never fires.
      (chip as HTMLElement).focus();
      fireEvent.keyDown(chip as HTMLElement, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(chip as HTMLElement, { key: "Enter", code: "Enter" });

      expect(onClear).toHaveBeenCalledOnce();
    },
  );

  it.fails("REGRESSION — the breadcrumb chip is keyboard-focusable (tabIndex present)", () => {
    render(<CleanBreadcrumbRepro page="settings" onClear={() => undefined} />);

    const chip = screen.getByText("settings");

    // Chip renders without `tabIndex` — a screen-reader user
    // TAB-ing through the palette skips it entirely. WAI-ARIA
    // requires interactive controls to be reachable via the
    // keyboard. This assertion documents the missing
    // `tabIndex="0"` on the DOM node.
    const tabIndex = chip.getAttribute("tabindex") ?? chip.getAttribute("tabIndex");
    expect(
      tabIndex,
      "Breadcrumb chip is not keyboard-focusable — Chip has no tabIndex. " +
        "Replace with <Button> or wrap in a focusable element.",
    ).not.toBeNull();
  });
});
