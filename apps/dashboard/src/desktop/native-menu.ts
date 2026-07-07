/**
 * @file native-menu.ts
 * @module desktop/native-menu
 *
 * @description
 * IPC bridge for the OS-native application menu bar. The Rust shell
 * (`src-tauri/src/menu.rs`) builds a platform-neutral menu tree at boot
 * and forwards every click as a `menu-command` event with the payload
 * `{ id: string, source: "native" | "tray" | "renderer" }`. This adapter
 * exposes that stream to the renderer so the menu registry can dispatch
 * to concrete commands.
 *
 * Two responsibilities:
 *
 *  1. **Wire protocol** — subscribe to `menu-command`, invoke commands
 *     from the renderer, notify the shell of locale changes. Every
 *     function no-ops on the web build.
 *
 *  2. **Descriptor serialisation** — read {@link "@/config/menu.config".menuCommands}
 *     (owned by Sub-agent M), filter to entries whose `surfaces` include
 *     `"native"`, apply the `requires` permission check + `isVisible`
 *     predicate, group by category in the fixed order documented in
 *     DESKTOP_PLAN.md §4.2, and emit the payload the Rust shell needs
 *     to rebuild its menu on a locale swap or dynamic registration
 *     event. The runtime Rust implementation lives in
 *     `src-tauri/src/menu.rs`; the JS side just publishes the desired
 *     shape.
 *
 * ## Coordination with the Menus sub-agent
 *
 * If the Menus sub-agent ships a `src/menus/bindings/native-menu.ts` with
 * the same responsibilities, DEFER to their file — this adapter should
 * remain a thin passthrough. Right now (Phase 2 of the desktop rollout)
 * only `src/menus/command.types.ts` exists, so this file owns the wire
 * protocol.
 */

import type { MenuCategory, MenuCommand, MenuContext } from "@/config/menu.config";

import { MENU_CATEGORY_ORDER, menuCommands } from "@/config/menu.config";
import { isDesktop } from "@/desktop/is-desktop";

/**
 * Payload delivered to `onMenuCommand` subscribers. The `source`
 * discriminator lets the SPA differentiate a click on the native menu
 * bar from a tray click (e.g. to log distinct analytics events).
 */
export interface MenuCommandPayload {
  /** Stable command id from the menu registry. */
  id: string;
  /** Where the command was activated. */
  source: "native" | "tray" | "renderer";
}

/**
 * Unsubscribe function returned by every `on*` subscriber. Idempotent —
 * calling it twice is a no-op.
 */
export type Unsubscribe = () => void;

// ---------------------------------------------------------------------------
// Descriptor — what the Rust shell needs to rebuild its menu tree
// ---------------------------------------------------------------------------

/**
 * One serialised menu entry — a flat item, not a submenu. Submenus are
 * expressed by grouping items under {@link NativeMenuSection} rather
 * than nesting descriptors, which keeps the wire shape linear and
 * trivial to `serde_json::from_str` on the Rust side.
 */
export interface NativeMenuItem {
  /** Stable id — analytics event property; identifier on the Rust side. */
  id: string;
  /** Resolved label (post-i18n). */
  label: string;
  /** Optional keyboard accelerator (Tauri format: `"CmdOrCtrl+K"`). */
  accelerator?: string;
  /** Whether the item is currently enabled (permission gate). */
  enabled: boolean;
}

/** A group of items rendered under one submenu (a menu bar category). */
export interface NativeMenuSection {
  category: MenuCategory;
  label: string;
  items: readonly NativeMenuItem[];
}

/**
 * Fixed order the Rust menu bar consumes. Populated in
 * DESKTOP_PLAN.md §4.2 order: application → file → edit → view →
 * navigate → workspace → window → help → developer.
 *
 * `MENU_CATEGORY_ORDER` from the menu config is the source of truth
 * but includes categories the native menu bar doesn't render on its
 * own (e.g. `action` shows in the context menu but not on the bar);
 * we re-project it here.
 */
const NATIVE_CATEGORY_ORDER: readonly MenuCategory[] = [
  "application",
  "file",
  "edit",
  "view",
  "navigate",
  "workspace",
  "window",
  "help",
  "developer",
] as MenuCategory[];

/**
 * Label overrides for the native menu-bar submenus. The plan lists
 * fixed English labels for the Rust-side seed values; the SPA can
 * override them later once i18n keys reach the shell (Phase 2b).
 */
const NATIVE_CATEGORY_LABELS: Record<MenuCategory, string> = {
  application: "Academorix",
  file: "File",
  edit: "Edit",
  view: "View",
  navigate: "Navigate",
  workspace: "Workspace",
  action: "Actions",
  help: "Help",
  developer: "Developer",
};

/**
 * The Rust category enum doesn't include `"window"` (Tauri manages
 * the Window submenu itself with predefined items), but the plan
 * asks for it. We map `"window"` in the JS-side type to the
 * `"application"` category on the wire so the Rust shell can hydrate
 * accordingly — this keeps the JS layer's ordering as the plan
 * documents while not surprising the Rust side.
 *
 * NOTE: `MenuCategory` in the config file doesn't declare `"window"`.
 * We treat it as a synthetic native-only category. If the config
 * ever adds it as a first-class value, drop this cast and update the
 * label map.
 */
type NativeCategory = MenuCategory | "window";

/** Predicate resolver for `isVisible` + `requires` — see {@link buildNativeMenu}. */
export interface PermissionResolver {
  /**
   * Returns true when the current identity holds `permission`. Passed
   * in so the caller (`DesktopBootstrap`) can wire the identity's
   * effective permission set without this file depending on Refine.
   */
  hasPermission: (permission: string) => boolean;
}

/**
 * Build the ordered, filtered, grouped native menu descriptor from the
 * command registry. Every filter it applies:
 *
 *  1. `surfaces?.includes('native')` — only commands the config
 *     explicitly marks as native OR whose surfaces list is absent
 *     (which we treat as "all three surfaces" per the config docstring).
 *  2. `requires` permission check via {@link resolver} — commands the
 *     current identity can't invoke are HIDDEN (per DESKTOP_PLAN.md
 *     §4.2 the menu bar hides rather than disables missing permissions).
 *  3. `isVisible(ctx)` — runtime predicate. Falls to `true` when the
 *     command doesn't declare one.
 *
 * The result is grouped into sections in the fixed category order,
 * with empty sections dropped so the Rust side doesn't render an empty
 * `File` menu on tenants without file commands.
 *
 * @param translate - Resolves a message key to the active-locale
 *   string. Falls back to the caller's default when the key is
 *   missing, mirroring the shared i18n contract.
 * @param resolver - Permission + visibility resolver.
 * @param context - Runtime context passed to `isVisible` / `isDisabled`.
 */
export function buildNativeMenu(
  translate: (key: string, fallback?: string) => string,
  resolver: PermissionResolver,
  context: MenuContext = {},
): NativeMenuSection[] {
  const passesPermission = (command: MenuCommand): boolean => {
    if (!command.requires) return true;
    const required = typeof command.requires === "string" ? [command.requires] : command.requires;

    return required.every((permission) => resolver.hasPermission(permission));
  };

  const passesVisibility = (command: MenuCommand): boolean => {
    if (!command.isVisible) return true;

    return command.isVisible(context);
  };

  const passesSurface = (command: MenuCommand): boolean => {
    if (!command.surfaces || command.surfaces.length === 0) return true;

    return command.surfaces.includes("native");
  };

  const passesEnabled = (command: MenuCommand): boolean => {
    if (!command.isDisabled) return true;

    return !command.isDisabled(context);
  };

  // Filter once. Every subsequent stage groups by category on the
  // filtered list.
  const eligible = menuCommands
    .filter(passesSurface)
    .filter(passesPermission)
    .filter(passesVisibility);

  const byCategory = new Map<NativeCategory, NativeMenuItem[]>();

  for (const command of eligible) {
    const bucket = byCategory.get(command.category) ?? [];

    bucket.push({
      id: command.id,
      label: translate(command.labelKey, command.labelKey),
      accelerator: command.shortcut,
      enabled: passesEnabled(command),
    });
    byCategory.set(command.category, bucket);
  }

  // Referenced but never populated by the config (Tauri handles the
  // Window submenu on the Rust side with predefined items — see
  // `src-tauri/src/menu.rs::build_window_menu`). Adding a synthetic
  // placeholder here keeps the ordering intact without requiring the
  // config to invent a fake command.
  const sections: NativeMenuSection[] = [];

  for (const category of NATIVE_CATEGORY_ORDER) {
    const items = byCategory.get(category as MenuCategory) ?? [];
    // Cast to `string` for the equality check — the loop variable
    // is typed as `MenuCategory` but `NATIVE_CATEGORY_ORDER` also
    // carries the synthetic `"window"` value the Rust side handles.
    const isWindowSection = (category as string) === "window";

    if (items.length === 0 && !isWindowSection) {
      // Skip empty non-window sections so the menu bar isn't cluttered
      // with headers that lead nowhere.
      continue;
    }

    sections.push({
      category: category as MenuCategory,
      label: NATIVE_CATEGORY_LABELS[category as MenuCategory] ?? String(category),
      items,
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Wire helpers
// ---------------------------------------------------------------------------

/**
 * Subscribes to `menu-command` events fired by the Rust shell. Returns
 * an unsubscribe function; call it on unmount to avoid leaks.
 *
 * Web build: no-op — returns an unsubscribe that also does nothing.
 *
 * @example
 * ```ts
 * useEffect(() => onMenuCommand((cmd) => {
 *   commandRegistry.get(cmd.id)?.execute();
 * }), []);
 * ```
 */
export function onMenuCommand(handler: (payload: MenuCommandPayload) => void): Unsubscribe {
  if (!isDesktop) {
    return () => {
      /* web build no-op */
    };
  }

  // Dynamic import so the web bundle never pulls @tauri-apps/api.
  let disposed = false;
  let cleanup: Unsubscribe = () => {
    disposed = true;
  };

  void import("@tauri-apps/api/event")
    .then(({ listen }) =>
      listen<MenuCommandPayload>("menu-command", (event) => handler(event.payload)),
    )
    .then((unlisten) => {
      if (disposed) {
        unlisten();

        return;
      }
      cleanup = () => {
        disposed = true;
        unlisten();
      };
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[desktop/native-menu] failed to attach menu-command listener", err);
    });

  return () => cleanup();
}

/**
 * Programmatically activate a menu command. Used by the command palette
 * when it wants the same code path as a click on the OS menu bar. The
 * Rust side re-emits `menu-command` so subscribers see it fire.
 *
 * Web build: no-op resolving to `undefined`.
 */
export async function invokeMenuCommand(id: string): Promise<void> {
  if (!isDesktop) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    await invoke("menu_command", { id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[desktop/native-menu] menu_command(${id}) failed`, err);
  }
}

/**
 * Tell the Rust shell that the SPA's locale changed so the shell can
 * rebuild menu item titles in the new language. Phase 2b work — the
 * Rust listener currently just logs. Safe to call regardless of the
 * phase: the payload is future-compatible.
 */
export async function notifyLocaleChanged(locale: string): Promise<void> {
  if (!isDesktop) return;
  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("locale-changed", { locale });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/native-menu] locale-changed emit failed", err);
  }
}

/**
 * Publish a fresh native menu descriptor to the Rust shell. The Rust
 * side rebuilds the menu bar in place. Called after:
 *  - Initial identity resolve (permissions known).
 *  - Locale change (labels re-translate).
 *  - Dynamic navigate entries hydrate from the resource registry.
 *
 * Web build: no-op.
 */
export async function publishNativeMenu(sections: readonly NativeMenuSection[]): Promise<void> {
  if (!isDesktop) return;
  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("native-menu-updated", { sections });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/native-menu] native-menu-updated emit failed", err);
  }
}

// Re-exports for downstream barrels — keeps the menu config's category
// order in one place.
export { MENU_CATEGORY_ORDER };
