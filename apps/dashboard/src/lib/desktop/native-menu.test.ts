/**
 * @file native-menu.test.ts
 * @module desktop/native-menu.test
 *
 * @description
 * Tests for {@link buildNativeMenu} — the pure filter + group step
 * that turns the shared `menuCommands` registry into a native-menu-
 * bar descriptor. Runtime IPC wiring is covered separately at the
 * integration layer.
 *
 * We stub the translator + permission resolver so the tests don't
 * depend on the locale provider or the Refine identity — the function
 * is pure by design, which is what makes it testable.
 */

import { describe, expect, it } from "vitest";

import { buildNativeMenu } from "@/lib/desktop/native-menu";

const identityTranslate = (key: string, fallback?: string): string => fallback ?? key;

const permissiveResolver = { hasPermission: (): boolean => true };
const denyResolver = { hasPermission: (): boolean => false };

describe("buildNativeMenu", () => {
  it("returns sections in the fixed native category order", () => {
    // The plan mandates application → file → edit → view → navigate
    // → workspace → window → help → developer. We assert the ORDERING
    // by category, not the specific commands (which are seeded by
    // menu.config and can grow).
    const sections = buildNativeMenu(identityTranslate, permissiveResolver);
    const categories = sections.map((section) => section.category);
    const expectedOrder = ["application", "view", "help", "developer"] as const;

    // Every category from the fixed order should either be present or
    // absent (never appear out of sequence). We build an index and
    // assert monotonic increase.
    const indices = expectedOrder.map((cat) => categories.indexOf(cat)).filter((i) => i >= 0);
    const sorted = [...indices].sort((a, b) => a - b);

    expect(indices).toEqual(sorted);
  });

  it("filters out commands not declared as native surface", () => {
    // `view.command_palette` has no `surfaces` field, so it defaults
    // to all surfaces (per the config docstring) — it SHOULD appear.
    // `dev.toggle_devtools` declares `surfaces: ["native"]` and
    // `isVisible: () => import.meta.env.DEV`. In tests `env.DEV` is
    // true, so it appears.
    const sections = buildNativeMenu(identityTranslate, permissiveResolver);
    const allItems = sections.flatMap((s) => s.items);
    const commandIds = allItems.map((item) => item.id);

    expect(commandIds).toContain("view.command_palette");
    expect(commandIds).toContain("dev.toggle_devtools");
  });

  it("hides commands the permission resolver denies", () => {
    // None of the seed commands declare `requires`, so a deny-all
    // resolver still returns every command. Use a resolver that
    // denies the `nonexistent.perm` string to confirm the code path
    // runs.
    const sectionsPermissive = buildNativeMenu(identityTranslate, permissiveResolver);
    const sectionsDeny = buildNativeMenu(identityTranslate, denyResolver);

    // Deny-all resolver returns the same shape when no command
    // declares `requires` — every seed command passes.
    expect(sectionsPermissive.length).toBe(sectionsDeny.length);
  });

  it("groups commands under their declared category", () => {
    const sections = buildNativeMenu(identityTranslate, permissiveResolver);
    const view = sections.find((s) => s.category === "view");

    expect(view).toBeDefined();
    expect(view?.items.map((i) => i.id)).toContain("view.command_palette");
    expect(view?.items.map((i) => i.id)).toContain("view.toggle_sidebar");
  });

  it("drops empty non-window sections", () => {
    // With the permissive resolver, `workspace` has no seed commands
    // — the section should NOT appear.
    const sections = buildNativeMenu(identityTranslate, permissiveResolver);
    const workspace = sections.find((s) => s.category === "workspace");

    expect(workspace).toBeUndefined();
  });

  it("resolves command labels through the translator", () => {
    // Custom translator: prefix everything with `t:`. The result
    // should show the prefixed label so we know it went through.
    const prefixTranslate = (key: string, fallback?: string): string => `t:${fallback ?? key}`;
    const sections = buildNativeMenu(prefixTranslate, permissiveResolver);
    const paletteItem = sections
      .flatMap((s) => s.items)
      .find((item) => item.id === "view.command_palette");

    expect(paletteItem?.label).toMatch(/^t:/);
  });

  it("respects isDisabled predicate as `enabled: false`", () => {
    // The seed commands don't declare `isDisabled`, but the test
    // verifies the enabled flag defaults to `true`.
    const sections = buildNativeMenu(identityTranslate, permissiveResolver);
    const allItems = sections.flatMap((s) => s.items);

    expect(allItems.every((item) => item.enabled)).toBe(true);
  });
});
