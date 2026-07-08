/**
 * @file menu-actions-bridge.tsx
 * @module menus/menu-actions-bridge
 *
 * @description
 * Invisible component that bridges named menu actions (from
 * {@link "@/menus/menu-actions"}) to concrete side-effects owned by the
 * authenticated shell — the command palette, the theme controller, the
 * sidebar toggle, and (in the future) other cross-tree verbs.
 *
 * Mount ONCE inside {@link "@/components/layout/authenticated-layout"} so
 * every registered action has exactly one listener. The bridge renders
 * `null` — its only job is to subscribe.
 *
 * ## Why a component (not a plain module)
 *
 * The actions we bridge live inside React contexts (palette, theme,
 * sidebar). We need hooks to read them, and hooks require a component.
 * Keeping the bridge in the `menus/` module keeps every wire in one file
 * — a future audit ("what does `view.toggle_sidebar` do?") starts and
 * ends here.
 *
 * ## Contract
 *
 *  - Every command declared in {@link "@/config/menu.config"} whose
 *    `execute` calls {@link "@/menus/menu-actions" invokeMenuAction} must
 *    have a matching subscription below.
 *  - Actions that don't need React state (opening an external URL,
 *    navigating client-side) bypass the bridge entirely — they run
 *    inline inside the command's `execute` callable.
 *  - The bridge is intentionally NOT permission-aware — it just wires
 *    the action bus to concrete effects. The registry is where
 *    permission gating lives.
 *
 * @see MENUS_PLAN.md §7 — Keyboard shortcuts + discoverability
 * @see menus/menu-actions — the event bus this bridge subscribes to
 */

import { useSidebar, useTheme } from "@academorix/ui/react";
import { useCallback } from "react";

import type { ReactNode } from "react";

import { useCommandPalette } from "@/components/command";
import { useMenuAction } from "@/menus/menu-actions";

/**
 * Bridges every registered menu action to a live handler. Mount ONCE
 * inside the authenticated shell.
 *
 * Emits nothing to the DOM — the effect-only pattern keeps the bridge
 * out of layout math (no wrapper divs, no flex-anchor surprises).
 */
export function MenuActionsBridge(): ReactNode {
  const commandPalette = useCommandPalette();
  const { theme, resolvedTheme, setTheme } = useTheme("system");
  const sidebar = useSidebar();

  // -------- view.command_palette → open the ⌘K palette
  const openCommandPalette = useCallback(() => {
    commandPalette.open();
  }, [commandPalette]);

  useMenuAction("view.command_palette", openCommandPalette);

  // -------- view.toggle_sidebar → toggle Sidebar.Provider state
  const toggleSidebar = useCallback(() => {
    sidebar.toggleSidebar();
  }, [sidebar]);

  useMenuAction("view.toggle_sidebar", toggleSidebar);

  // -------- view.toggle_theme → swap between light and dark
  // Follow the switcher's model: `system` resolves to a concrete
  // resolvedTheme, so a toggle from system flips to the opposite of
  // whatever the OS is currently painting. This matches macOS'
  // "Cmd+Shift+T" convention where the user sees an immediate
  // visual change regardless of the auto-follow setting.
  const toggleTheme = useCallback(() => {
    const current = theme === "system" ? resolvedTheme : theme;

    setTheme(current === "dark" ? "light" : "dark");
  }, [theme, resolvedTheme, setTheme]);

  useMenuAction("view.toggle_theme", toggleTheme);

  return null;
}
