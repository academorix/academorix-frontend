/**
 * @fileoverview useShortcutScope — push / pop a shortcut scope.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useEffect } from "react";
import { useInject } from "@stackra/container/react";

import { SHORTCUT_REGISTRY } from "../../tokens";
import type { ShortcutRegistry } from "../../registries/shortcut.registry";

/**
 * Push a scope onto the shortcut stack while this component is mounted.
 *
 * Pop happens automatically on unmount. Useful for modals / popovers /
 * the command palette itself — they push a scope so their bindings
 * shadow global ones until they close.
 *
 * @param scope - Scope name (e.g. `"command-palette"`, `"modal"`).
 * @param active - Pause the scope when set to `false` (default `true`).
 *
 * @example
 * ```tsx
 * useShortcutScope("modal", isOpen);
 * useShortcut({
 *   scope: "modal",
 *   description: "Close modal",
 *   combo: { key: "escape" },
 *   handler: onClose,
 * });
 * ```
 */
export function useShortcutScope(scope: string, active: boolean = true): void {
  const registry = useInject<ShortcutRegistry>(SHORTCUT_REGISTRY);
  useEffect(() => {
    if (!active) return;
    registry.pushScope(scope);
    return () => registry.popScope(scope);
  }, [registry, scope, active]);
}
