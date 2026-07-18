/**
 * @fileoverview useShortcut — register a shortcut for the lifetime of a component.
 *
 * The hook auto-generates an id when none is provided and unregisters
 * on unmount. Shortcut config is allowed to use either a `handler`
 * or a `to` route — the registry resolves the action through the
 * keyboard listener.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useEffect, useId } from "react";
import { useInject } from "@stackra/container/react";

import { SHORTCUT_REGISTRY } from "../../tokens";
import type { Shortcut } from "../../interfaces/shortcut.interface";
import type { ShortcutRegistry } from "../../registries/shortcut.registry";
import { KeyboardListenerService } from "../../services/keyboard-listener.service";

/**
 * Register a shortcut for the lifetime of the calling component.
 *
 * @param shortcut - Shortcut definition (id is optional).
 *
 * @example
 * ```tsx
 * useShortcut({
 *   description: "Save",
 *   combo: { mod: true, key: "s" },
 *   handler: () => formRef.current?.submit(),
 *   type: "action",
 * });
 *
 * useShortcut({
 *   description: "Go to products",
 *   combo: { sequence: ["g", "p"] },
 *   to: "/products",
 *   type: "navigation",
 * });
 * ```
 */
export function useShortcut(shortcut: Omit<Shortcut, "id"> & { id?: string }): void {
  const registry = useInject<ShortcutRegistry>(SHORTCUT_REGISTRY);
  const listener = useInject<KeyboardListenerService>(KeyboardListenerService);
  const fallbackId = useId();
  const id = shortcut.id ?? `useShortcut::${fallbackId}`;

  useEffect(() => {
    const fullShortcut = { ...shortcut, id } as Shortcut;
    registry.registerShortcut(fullShortcut);
    // Sync with the keyboard listener so TanStack picks it up
    listener.syncShortcut(fullShortcut);
    return () => {
      listener.unregisterShortcut(id);
      registry.unregisterShortcut(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    "handler" in shortcut ? shortcut.handler : undefined,
    "to" in shortcut ? shortcut.to : undefined,
    shortcut.scope,
    shortcut.type,
    shortcut.allowInInput,
    shortcut.preventDefault,
    shortcut.stopPropagation,
    JSON.stringify(shortcut.combo),
  ]);
}
