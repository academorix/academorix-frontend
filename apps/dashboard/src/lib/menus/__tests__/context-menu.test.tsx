/**
 * @file context-menu.test.tsx
 * @module menus/__tests__/context-menu.test
 *
 * @description
 * Unit coverage for the `ContextMenu` renderer. The full visual — Popover,
 * portal, react-aria positioning — needs a real browser to exercise
 * end-to-end (see `e2e/menus.spec.ts`); the tests here focus on:
 *
 *   - `splitOverflow` — the pure category-boundary-aware split.
 *   - Rendering contract — closed menu emits no popover; open menu emits
 *     the anchor + popover; category headings appear per rendered group.
 *
 * We do NOT assert against React Aria's internal positioning here: jsdom
 * has no layout engine, so `useOverlayPosition` produces `{top: 0, left: 0}`
 * in the test environment. Playwright covers positioning end-to-end.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MenuCategory, MenuCommand } from "@/lib/menus/command.types";

import { ContextMenu, TOP_LEVEL_LIMIT, splitOverflow } from "@/lib/menus/context-menu";

/** Command factory — every case shares defaults for compactness. */
function makeCommand(overrides: Partial<MenuCommand> = {}): MenuCommand {
  return {
    id: overrides.id ?? "cmd.test",
    labelKey: overrides.labelKey ?? "menu.test",
    category: overrides.category ?? "help",
    execute: overrides.execute ?? ((): void => undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// splitOverflow
// ---------------------------------------------------------------------------

describe("splitOverflow", () => {
  it("returns all items in visible when under the cap", () => {
    const grouped = new Map<MenuCategory, MenuCommand[]>([
      ["help", [makeCommand({ id: "a" }), makeCommand({ id: "b" })]],
    ]);
    const { visible, overflow } = splitOverflow(grouped, TOP_LEVEL_LIMIT);

    expect(visible.get("help")).toHaveLength(2);
    expect(overflow).toHaveLength(0);
  });

  it("keeps whole categories in visible when they fit", () => {
    const grouped = new Map<MenuCategory, MenuCommand[]>([
      ["view", [makeCommand({ id: "v1" })]],
      ["help", [makeCommand({ id: "h1" })]],
    ]);
    const { visible, overflow } = splitOverflow(grouped, TOP_LEVEL_LIMIT);

    expect([...visible.keys()]).toEqual(["view", "help"]);
    expect(overflow).toEqual([]);
  });

  it("spills the tail of a partially-fitting first category", () => {
    const commands = Array.from({ length: 15 }, (_, i) => makeCommand({ id: `cmd.${i}` }));
    const grouped = new Map<MenuCategory, MenuCommand[]>([["help", commands]]);
    const { visible, overflow } = splitOverflow(grouped, 12);

    expect(visible.get("help")).toHaveLength(12);
    expect(overflow).toHaveLength(3);
    expect(overflow.map((cmd) => cmd.id)).toEqual(["cmd.12", "cmd.13", "cmd.14"]);
  });

  it("spills every following category once the cap is reached", () => {
    const view = Array.from({ length: 12 }, (_, i) =>
      makeCommand({ id: `view.${i}`, category: "view" }),
    );
    const help = Array.from({ length: 3 }, (_, i) =>
      makeCommand({ id: `help.${i}`, category: "help" }),
    );
    const grouped = new Map<MenuCategory, MenuCommand[]>([
      ["view", view],
      ["help", help],
    ]);
    const { visible, overflow } = splitOverflow(grouped, 12);

    expect(visible.get("view")).toHaveLength(12);
    expect(visible.has("help")).toBe(false);
    expect(overflow).toHaveLength(3);
  });

  it("returns empty overflow for an empty grouped input", () => {
    const grouped = new Map<MenuCategory, MenuCommand[]>();
    const { visible, overflow } = splitOverflow(grouped, TOP_LEVEL_LIMIT);

    expect(visible.size).toBe(0);
    expect(overflow).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rendering contract
// ---------------------------------------------------------------------------

describe("ContextMenu rendering", () => {
  it("renders nothing visible when isOpen=false (only the anchor stub)", () => {
    render(
      <ContextMenu
        close={(): void => undefined}
        context={{}}
        isOpen={false}
        items={[makeCommand()]}
        position={{ x: 0, y: 0 }}
      />,
    );

    // The invisible anchor is always present so its ref stays stable.
    expect(screen.getByTestId("context-menu-anchor")).toBeInTheDocument();
    // No popover contents when closed.
    expect(screen.queryByTestId("context-menu-popover")).not.toBeInTheDocument();
  });

  it("renders the popover when isOpen=true", () => {
    render(
      <ContextMenu
        isOpen
        close={(): void => undefined}
        context={{}}
        items={[makeCommand({ id: "help.docs", category: "help" })]}
        position={{ x: 42, y: 128 }}
      />,
    );

    expect(screen.getByTestId("context-menu-popover")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu-heading-help")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu-item-help.docs")).toBeInTheDocument();
  });

  it("renders category headings in canonical order", () => {
    render(
      <ContextMenu
        isOpen
        close={(): void => undefined}
        context={{}}
        items={[
          makeCommand({ id: "help.docs", category: "help" }),
          makeCommand({ id: "view.palette", category: "view" }),
        ]}
        position={{ x: 0, y: 0 }}
      />,
    );

    const view = screen.getByTestId("context-menu-heading-view");
    const help = screen.getByTestId("context-menu-heading-help");

    // `view` precedes `help` in MENU_CATEGORY_ORDER, so the DOM order must
    // match — asserting via `compareDocumentPosition` bit flags.
    expect(view.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("applies the translator when provided", () => {
    render(
      <ContextMenu
        isOpen
        close={(): void => undefined}
        context={{}}
        items={[makeCommand({ id: "help.docs", labelKey: "menu.docs", category: "help" })]}
        position={{ x: 0, y: 0 }}
        translate={(key) => (key === "menu.docs" ? "Documentation" : key)}
      />,
    );

    const item = screen.getByTestId("context-menu-item-help.docs");

    expect(item.textContent).toContain("Documentation");
  });
});
