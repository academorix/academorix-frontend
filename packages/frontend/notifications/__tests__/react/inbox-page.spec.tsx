// @vitest-environment jsdom
/**
 * @file inbox-page.spec.tsx
 * @module @stackra/notifications/__tests__/react
 * @description Regression coverage — Round 6 UI reviewer P1 (C).
 *
 *   The inbox page's section chooser (Unread / All) used the same
 *   hand-rolled `role="tablist"` + `role="tab"` pattern the drawer
 *   did — with no ArrowLeft / ArrowRight / Home / End keyboard
 *   handling per the WAI-ARIA "Tabs" pattern. Full-page inbox
 *   makes the miss more acute since the whole surface belongs to
 *   this control.
 *
 *   Fix (2026-07-21): migrated to HeroUI's `ToggleButtonGroup` in
 *   `selectionMode="single"`. React Aria owns the roving-tabindex
 *   keyboard model, so arrow keys, Home / End, and `aria-pressed`
 *   state are all handled natively. The tab semantic was dropped
 *   deliberately — the chooser filters a shared inbox list, not
 *   distinct panels, so `role="button"` with `aria-pressed` is the
 *   semantically correct shape.
 *
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Stub the DI-driven hooks the page consumes.
vi.mock("@/react/hooks/use-renderable-notifications", () => ({
  useRenderableNotifications: () => ({
    entries: [],
    unreadCount: 2,
  }),
}));

vi.mock("@/react/hooks/use-notification-writes", () => ({
  useNotificationWrites: () => ({
    markSeen: vi.fn(async () => undefined),
    markAllSeen: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    updatePreferences: vi.fn(async () => undefined),
    isPending: false,
    error: null,
  }),
}));

// NotificationList — depends on more DI hooks; neutralise for this
// spec since we only care about the section chooser.
vi.mock("@/react/components/notification-list", () => ({
  NotificationList: () => null,
}));

// Import AFTER the mocks are hoisted.
import { InboxPage } from "@/react/pages/inbox-page/inbox-page.component";

afterEach(cleanup);

describe("<InboxPage> — section chooser keyboard nav", () => {
  /**
   * Fetch the "Unread" and "All" toggle buttons.
   *
   * HeroUI's `ToggleButtonGroup` renders the group under a
   * container labelled by `aria-label` and stamps `role="button"`
   * on each `ToggleButton`. We narrow by name from the DOM so the
   * test survives if React Aria ever tweaks the container's own
   * role.
   */
  function getSectionButtons(): [HTMLElement, HTMLElement] {
    const container = document.querySelector<HTMLElement>('[aria-label="Sections"]');

    if (!container) throw new Error('No element with aria-label="Sections" found');
    const buttons = Array.from(container.querySelectorAll<HTMLElement>("button"));
    const unread = buttons.find((b) => /unread/i.test(b.textContent ?? ""));
    const all = buttons.find((b) => /^\s*all\s*$/i.test(b.textContent ?? ""));

    if (!unread || !all) throw new Error("Expected Unread and All buttons in the section chooser");
    return [unread, all];
  }

  it("ArrowRight on the Unread toggle moves focus to the All toggle", () => {
    render(<InboxPage />);

    const [unread, all] = getSectionButtons();

    unread.focus();
    expect(document.activeElement).toBe(unread);

    fireEvent.keyDown(unread, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    expect(document.activeElement).toBe(all);
  });

  it("ArrowLeft on the All toggle moves focus back to the Unread toggle", () => {
    render(<InboxPage />);

    const [unread, all] = getSectionButtons();

    all.focus();
    expect(document.activeElement).toBe(all);

    fireEvent.keyDown(all, {
      key: "ArrowLeft",
      code: "ArrowLeft",
    });

    expect(document.activeElement).toBe(unread);
  });

  it("the active toggle reports its selection state via aria-checked", () => {
    // React Aria's ToggleButtonGroup with `selectionMode="single"`
    // uses the WAI-ARIA "radiogroup" pattern under the hood — each
    // toggle becomes `role="radio"` and reports selection via
    // `aria-checked`, not `aria-pressed`. Screen readers then
    // announce "Unread, radio button, checked" alongside the
    // group's own label.
    render(<InboxPage />);

    const [unread, all] = getSectionButtons();

    expect(unread.getAttribute("role")).toBe("radio");
    expect(unread.getAttribute("aria-checked")).toBe("true");
    expect(all.getAttribute("aria-checked")).toBe("false");
  });
});
