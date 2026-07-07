/**
 * @file menu-actions.ts
 * @module menus/menu-actions
 *
 * @description
 * Tiny cross-tree event bus that lets a menu command (declared at module
 * scope inside {@link "@/config/menu.config"}) call into a live React
 * subtree — the command palette, the theme switcher, the sidebar toggle,
 * the shortcut sheet — without any of them needing to know each other.
 *
 * ## Why an event bus (not an import)
 *
 * The command registry lives in a plain `.ts` module that is imported at
 * boot. It cannot reach into React hooks like `useCommandPalette` or
 * `useTheme` because those live inside providers that mount lower in the
 * tree. A traditional "publish a module-level ref" pattern (like
 * {@link "@/onboarding/tour/tour-provider" restartTour} does) works fine
 * for a single caller, but scales badly once every category of command
 * needs one.
 *
 * We instead expose a **named-action** bus keyed by strings that
 * `menu.config.ts` calls with `invokeMenuAction("view.toggle_sidebar")`.
 * Any React component subscribes with the {@link useMenuAction} hook and
 * runs the actual side-effect. The result is:
 *
 *  - The menu config stays pure data + names.
 *  - Each provider that owns state (command palette, theme, sidebar,
 *    shortcut sheet) registers exactly one handler, near its state.
 *  - The bridge component that wires everything together lives in ONE
 *    place ({@link "@/menus/menu-actions-bridge"}) and is unit-testable
 *    with a plain `dispatchEvent`.
 *
 * ## Contract
 *
 *  - `invokeMenuAction(name)` never throws even without listeners; it
 *    dispatches a DOM CustomEvent and moves on. Missing listeners are a
 *    dev-time oversight, not a runtime error.
 *  - `useMenuAction(name, handler)` attaches / detaches once per name/
 *    handler pair. Multiple subscribers per name is legal but rare —
 *    tests use it to intercept without patching the global bus.
 *  - The event object carries only the action name in `detail.name`,
 *    plus an optional `detail.payload` slot for future extensions.
 *    Callers may pass a payload through; renderers ignore it today.
 */

import { useEffect } from "react";

/**
 * Canonical event type used by every dispatch. Kept private to this
 * module so consumers cannot bind arbitrary listeners at the DOM level;
 * they must go through the {@link useMenuAction} hook.
 */
const MENU_ACTION_EVENT = "academorix:menu-action";

/** Payload carried on every dispatch. */
interface MenuActionEventDetail {
  /** Named action, matching the string a command uses to call. */
  name: string;
  /** Reserved for future data-bearing actions (e.g. theme name). */
  payload?: unknown;
}

/**
 * Fire an action by name. Called from menu command `execute` callables in
 * {@link "@/config/menu.config"}. Silent when the DOM is not available
 * (SSR / vitest node env) — the caller cannot preflight the environment
 * because commands may be invoked from any surface.
 *
 * @param name - Action name. Convention is `<category>.<verb>` matching
 *               the menu command id (e.g. `"view.toggle_sidebar"`).
 * @param payload - Optional payload passed to listeners.
 */
export function invokeMenuAction(name: string, payload?: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  const event: CustomEvent<MenuActionEventDetail> = new CustomEvent(MENU_ACTION_EVENT, {
    detail: { name, payload },
  });

  window.dispatchEvent(event);
}

/**
 * Subscribe a handler to an action. Runs `handler` on every dispatch that
 * matches `name`. The subscription is torn down on unmount / name change.
 *
 * ## Handler stability
 *
 * The hook re-attaches when `handler` changes reference. Consumers that
 * want stable listeners should wrap their handler in `useCallback` — a
 * pattern the bridge follows for every registration.
 *
 * @param name - Action name to match, same convention as
 *               {@link invokeMenuAction}.
 * @param handler - The side-effect to run on match. Payload is passed
 *                  through unchanged.
 */
export function useMenuAction(name: string, handler: (payload?: unknown) => void): void {
  useEffect(() => {
    // SSR guard mirrors the invoker so a hook rendered on the server
    // (a rare but legal case for hydration boundaries) does not touch
    // `window`. Vitest with jsdom passes this check, so tests still run.
    if (typeof window === "undefined") {
      return undefined;
    }

    const listener = (event: Event): void => {
      // The `Event` type is broad; narrow to `CustomEvent` at the entry
      // point so downstream reads are typesafe.
      const detail = (event as CustomEvent<MenuActionEventDetail>).detail;

      if (!detail || detail.name !== name) {
        return;
      }

      handler(detail.payload);
    };

    window.addEventListener(MENU_ACTION_EVENT, listener);

    return (): void => {
      window.removeEventListener(MENU_ACTION_EVENT, listener);
    };
  }, [name, handler]);
}
