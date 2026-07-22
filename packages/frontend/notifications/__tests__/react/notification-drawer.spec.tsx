// @vitest-environment jsdom
/**
 * @file notification-drawer.spec.tsx
 * @module @stackra/notifications/__tests__/react
 * @description REGRESSION test — Round 6 UI reviewer finding P1 (B).
 *
 *   The drawer's section-tab strip (`Unread` / `All`) inside
 *   `notification-drawer.component.tsx` stamps `role="tab"` on the
 *   two `<button>` triggers and `role="tablist"` on the wrapping
 *   `<div>` — but has no ArrowLeft / ArrowRight / Home / End
 *   keyboard nav per the WAI-ARIA "Tabs" pattern. A keyboard-only
 *   user cannot move between "Unread" and "All" without leaving
 *   the tab list entirely.
 *
 *   This is a P1 accessibility regression that fails WCAG 2.2 AA
 *   Success Criterion 2.1.1 (Keyboard).
 *
 *   Fix suggested by the UI reviewer report:
 *   Wire an `onKeyDown` handler on `role="tablist"` that:
 *     - ArrowRight / ArrowLeft moves focus among the tab buttons,
 *     - Home / End jumps to the first / last tab,
 *     - Enter / Space activates the focused tab (already implicit
 *       for `<button>` — but explicit is safer).
 *   See `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *   §"P1 findings > notification-drawer".
 *
 *   The drawer's rendering pipeline threads through DI-injected
 *   hooks (`useRenderableNotifications`, `useNotificationWrites`) —
 *   both are stubbed via `vi.mock(...)` so the test focuses purely
 *   on the section-tab keyboard behavior.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Stub the two DI-driven hooks so the drawer renders without a
// container. Order matters — Vitest hoists `vi.mock(...)` above
// every `import` statement below.
vi.mock("@/react/hooks/use-renderable-notifications", () => ({
  useRenderableNotifications: () => ({
    entries: [],
    unreadCount: 3,
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

// The push permission banner + notification list both depend on
// more DI hooks. Neutralise them for this test — we only care about
// the section-tab strip.
vi.mock("@/react/components/push-permission-banner", () => ({
  PushPermissionBanner: () => null,
}));

vi.mock("@/react/components/notification-list", () => ({
  NotificationList: () => null,
}));

// Import AFTER mocks are hoisted.
import { NotificationDrawer } from "@/react/components/notification-drawer/notification-drawer.component";

// Polyfill matchMedia — HeroUI's Drawer reads it at module load.
if (typeof globalThis.window !== "undefined" && !globalThis.window.matchMedia) {
  globalThis.window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

afterEach(cleanup);

// REGRESSION — Round 6 UI reviewer P1 (B). Fix by wiring
// ArrowLeft/ArrowRight (+ Home/End) keyboard nav on the drawer's
// section `role="tablist"` per the WAI-ARIA tab pattern.

describe("<NotificationDrawer> — section-tab keyboard nav", () => {
  /**
   * The tablist inside the drawer body — narrowed by its
   * `aria-label`. Returns null if the drawer chose to render a
   * different structure.
   */
  function getSectionTabList(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[role="tablist"][aria-label="Sections"]');
  }

  it.fails("REGRESSION — ArrowRight on the Unread tab moves focus to the All tab", () => {
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

    const tablist = getSectionTabList();
    expect(tablist, "Drawer must render the section role=tablist").not.toBeNull();

    // Two tabs: "Unread" and "All".
    const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
    expect(tabs.length).toBe(2);

    const [unread, all] = tabs;
    expect(unread).toBeDefined();
    expect(all).toBeDefined();

    (unread as HTMLElement).focus();
    expect(document.activeElement).toBe(unread);

    fireEvent.keyDown(unread as HTMLElement, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    // Today there is no keyboard handler on the tablist — focus
    // does NOT advance. This assertion documents the missing WAI-ARIA
    // behavior.
    expect(document.activeElement).toBe(all);
  });

  it.fails("REGRESSION — ArrowLeft on the All tab moves focus back to the Unread tab", () => {
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

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

    // Same regression, opposite direction — the WAI-ARIA pattern
    // requires ArrowLeft to wrap or move backwards.
    expect(document.activeElement).toBe(unread);
  });

  it.fails("REGRESSION — Home on any tab moves focus to the first tab", () => {
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

    const tablist = getSectionTabList();
    expect(tablist).not.toBeNull();
    const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
    expect(tabs.length).toBe(2);

    const [unread, all] = tabs;

    (all as HTMLElement).focus();
    expect(document.activeElement).toBe(all);

    fireEvent.keyDown(all as HTMLElement, {
      key: "Home",
      code: "Home",
    });

    // Home should jump to the first tab. Today: no handler → focus
    // stays on "All".
    expect(document.activeElement).toBe(unread);
  });

  it.fails(
    "REGRESSION — every tab under the tablist has `aria-controls` pointing at a `role=tabpanel`",
    () => {
      // Additional WAI-ARIA requirement: tabs should reference their
      // panel via `aria-controls`. This test documents the missing
      // link too — the drawer currently omits `aria-controls` entirely.
      render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

      const tablist = getSectionTabList();
      expect(tablist).not.toBeNull();
      const tabs = tablist ? Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')) : [];
      expect(tabs.length).toBe(2);

      // Reference silence assertion — screen readers rely on this to
      // announce "tab 1 of 2 controls panel X".
      for (const tab of tabs) {
        const controlledId = tab.getAttribute("aria-controls");
        expect(
          controlledId,
          `Tab "${tab.textContent}" is missing aria-controls — screen reader can't jump to the panel.`,
        ).not.toBeNull();
      }
    },
  );
});
