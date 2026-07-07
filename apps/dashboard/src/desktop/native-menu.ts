/**
 * @file native-menu.ts
 * @module desktop/native-menu
 *
 * @description
 * IPC bridge for the OS-native application menu bar. The Rust shell
 * (`src-tauri/src/menu.rs`) builds a platform-neutral menu tree at boot
 * and forwards every click as a `menu-command` event with the payload
 * `{ id: string, source: "native" | "tray" | "renderer" }`. This adapter
 * exposes that stream to the renderer so the {@link "@/menus"} sub-system
 * (owned by the Menus sub-agent) can dispatch to concrete commands.
 *
 * ## Coordination with the Menus sub-agent
 *
 * If the Menus sub-agent ships a `src/menus/bindings/native-menu.ts` with
 * the same responsibilities, DEFER to their file — this adapter should
 * remain a thin passthrough. Right now (Phase 2 of the desktop rollout)
 * only `src/menus/command.types.ts` exists, so this file owns the wire
 * protocol.
 *
 * ## Wire protocol
 *
 * - Renderer → Rust: `invoke("menu_command", { id: "app.preferences" })`
 *   (the Rust handler re-emits the event so the same registry can handle
 *   both native-menu clicks and programmatic activations).
 * - Rust → Renderer: `emit("menu-command", { id, source })`.
 * - Renderer → Rust (locale change): `emit("locale-changed", { locale })`.
 *
 * Every function no-ops on the web build (see `is-desktop.ts`).
 */

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
