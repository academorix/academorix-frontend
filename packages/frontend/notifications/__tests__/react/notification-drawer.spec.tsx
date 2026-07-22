// @vitest-environment jsdom
/**
 * @file notification-drawer.spec.tsx
 * @module @stackra/notifications/__tests__/react
 * @description Regression coverage — Round 6 UI reviewer P1 (B).
 *
 *   The drawer's section chooser ("Unread" / "All") used to be a
 *   hand-rolled `role="tablist"` + `role="tab"` strip with no
 *   ArrowLeft / ArrowRight / Home / End keyboard handling —
 *   keyboard-only users could not move between the two sections
 *   without leaving the tablist entirely.
 *
 *   Fix (2026-07-21): the strip was migrated to HeroUI's
 *   `ToggleButtonGroup` in `selectionMode="single"`. React Aria
 *   owns the roving-tabindex keyboard model, so arrow keys,
 *   Home / End, and `aria-pressed` state are all handled natively.
 *   The tab semantic was intentionally dropped — the chooser
 *   filters a shared notification list, not distinct panels, so
 *   `role="button"` with `aria-pressed` is the semantically
 *   correct shape (WAI-ARIA authoring practices).
 *
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
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
// the section chooser.
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

describe("<NotificationDrawer> — section chooser keyboard nav", () => {
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
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

    const [unread, all] = getSectionButtons();

    // Focus the Unread toggle. React Aria's toggle group manages
    // its own roving tabindex, so we bypass Tab navigation and go
    // straight to the target.
    unread.focus();
    expect(document.activeElement).toBe(unread);

    fireEvent.keyDown(unread, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    // Fix landed — ArrowRight advances focus to the next toggle.
    expect(document.activeElement).toBe(all);
  });

  it("ArrowLeft on the All toggle moves focus back to the Unread toggle", () => {
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

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
    render(<NotificationDrawer isOpen onOpenChange={() => undefined} />);

    const [unread, all] = getSectionButtons();

    expect(unread.getAttribute("role")).toBe("radio");
    expect(unread.getAttribute("aria-checked")).toBe("true");
    expect(all.getAttribute("aria-checked")).toBe("false");
  });
});
