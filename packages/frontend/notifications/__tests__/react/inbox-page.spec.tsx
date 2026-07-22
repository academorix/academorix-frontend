// @vitest-environment jsdom
/**
 * @file inbox-page.spec.tsx
 * @module @stackra/notifications/__tests__/react
 * @description REGRESSION test — Round 6 UI reviewer finding P1 (C).
 *
 *   The inbox page renders the SAME section-tab strip pattern the
 *   drawer does (`Unread` / `All`) — same shape, same shortcomings.
 *   `inbox-page.component.tsx` stamps `role="tab"` on each button
 *   and `role="tablist"` on the wrapper `<div>`, but has no
 *   ArrowLeft / ArrowRight / Home / End keyboard handling per the
 *   WAI-ARIA "Tabs" pattern. A keyboard-only user cannot move
 *   between "Unread" and "All" inside the tab list.
 *
 *   Since this is the full-page inbox (a route consumers mount at
 *   `/notifications`), keyboard navigation matters even more here
 *   than on the drawer — the whole surface belongs to this control.
 *
 *   This is a P1 accessibility regression that fails WCAG 2.2 AA
 *   Success Criterion 2.1.1 (Keyboard).
 *
 *   Fix suggested by the UI reviewer report:
 *   Same as the drawer — wire an `onKeyDown` on `role="tablist"`
 *   with ArrowRight/ArrowLeft/Home/End, and add `aria-controls`
 *   pointing at each `role="tabpanel"`. See
 *   `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *   §"P1 findings > inbox-page".
 *
 *   `useRenderableNotifications` + `useNotificationWrites` are the
 *   DI-driven dependencies; both are `vi.mock(...)`'d so the test
 *   isolates the tab-strip keyboard behavior.
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
// spec since we only care about the tab strip.
vi.mock("@/react/components/notification-list", () => ({
  NotificationList: () => null,
}));

// Import AFTER the mocks are hoisted.
import { InboxPage } from "@/react/pages/inbox-page/inbox-page.component";

afterEach(cleanup);

// REGRESSION — Round 6 UI reviewer P1 (C). Fix by wiring
// ArrowLeft/ArrowRight (+ Home/End) keyboard nav on the inbox
// section `role="tablist"` per the WAI-ARIA tab pattern.

describe("<InboxPage> — section-tab keyboard nav", () => {
  /**
   * The section tablist inside the inbox page. Uses the same
   * `aria-label="Sections"` shape the drawer does.
   */
  function getSectionTabList(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[role="tablist"][aria-label="Sections"]');
  }

  it.fails("REGRESSION — ArrowRight on the Unread tab moves focus to the All tab", () => {
    render(<InboxPage />);

    const tablist = getSectionTabList();
    expect(tablist, "Inbox must render a section role=tablist").not.toBeNull();

    const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
    expect(tabs.length).toBe(2);

    const [unread, all] = tabs;

    (unread as HTMLElement).focus();
    expect(document.activeElement).toBe(unread);

    fireEvent.keyDown(unread as HTMLElement, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    // Regression documented — no ArrowRight handler on the tablist.
    expect(document.activeElement).toBe(all);
  });

  it.fails("REGRESSION — ArrowLeft on the All tab moves focus back to the Unread tab", () => {
    render(<InboxPage />);

    const tablist = getSectionTabList();
    expect(tablist).not.toBeNull();
    const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
    expect(tabs.length).toBe(2);

    const [unread, all] = tabs;

    (all as HTMLElement).focus();
    expect(document.activeElement).toBe(all);

    fireEvent.keyDown(all as HTMLElement, {
      key: "ArrowLeft",
      code: "ArrowLeft",
    });

    expect(document.activeElement).toBe(unread);
  });

  it.fails("REGRESSION — Home on any tab moves focus to the first tab", () => {
    render(<InboxPage />);

    const tablist = getSectionTabList();
    expect(tablist).not.toBeNull();
    const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
    expect(tabs.length).toBe(2);

    const [unread, all] = tabs;

    (all as HTMLElement).focus();
    fireEvent.keyDown(all as HTMLElement, {
      key: "Home",
      code: "Home",
    });

    expect(document.activeElement).toBe(unread);
  });

  it.fails(
    "REGRESSION — every tab under the tablist has `aria-controls` pointing at a `role=tabpanel`",
    () => {
      render(<InboxPage />);

      const tablist = getSectionTabList();
      expect(tablist).not.toBeNull();
      const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
      expect(tabs.length).toBe(2);

      for (const tab of tabs) {
        const controlledId = tab.getAttribute("aria-controls");
        expect(
          controlledId,
          `Tab "${tab.textContent}" is missing aria-controls — screen readers can't announce the linked panel.`,
        ).not.toBeNull();
      }
    },
  );
});
