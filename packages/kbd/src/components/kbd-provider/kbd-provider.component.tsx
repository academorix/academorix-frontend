/**
 * @fileoverview KbdProvider — bootstraps the keyboard subsystem.
 *
 * Wraps the app with TanStack Hotkeys' `HotkeysProvider`, wires the
 * router's `useNavigate` into the listener and palette service,
 * and registers the default shortcuts (⌘K, ⇧?, ⌘/).
 *
 * @module @stackra/kbd
 * @category Components
 */

import { useState, useEffect, type ReactNode, type ReactElement } from "react";
import { useInject, useOptionalInject } from "@stackra/container/react";
import { EVENT_EMITTER } from "@stackra/contracts";
import type { EventEmitter } from "@stackra/events";
import { HotkeysProvider } from "@tanstack/react-hotkeys";

import { NavigationCommands } from "../../events";
import {
  COMMAND_PALETTE_SERVICE,
  KBD_CONFIG,
  KEYBOARD_CATALOG_SERVICE,
  KEYBOARD_HINTS_SERVICE,
  SHORTCUT_REGISTRY,
} from "../../tokens";
import type { KbdModuleOptions as KbdConfig } from "../../interfaces/kbd-config.interface";
import type { CommandPaletteService } from "../../services/command-palette.service";
import { KeyboardListenerService } from "../../services/keyboard-listener.service";
import type { KeyboardCatalogService } from "../../services/keyboard-catalog.service";
import type { KeyboardHintsService } from "../../services/keyboard-hints.service";
import type { ShortcutRegistry } from "../../registries/shortcut.registry";

import { KeyboardHints } from "./../keyboard-hints/keyboard-hints.component";

/**
 * Props for the {@link KbdProvider} component.
 */
export interface KbdProviderProps {
  children: ReactNode;
  /**
   * Whether to include TanStack Devtools.
   *
   * @default false
   */
  devtools?: boolean;
}

/**
 * Provider that boots the keyboard subsystem.
 *
 * Wraps children with TanStack Hotkeys' `HotkeysProvider` and
 * initializes the keyboard listener service.
 */
export function KbdProvider({ children, devtools = false }: KbdProviderProps): ReactElement {
  const listener = useInject<KeyboardListenerService>(KeyboardListenerService);
  const registry = useInject<ShortcutRegistry>(SHORTCUT_REGISTRY);
  const palette = useInject<CommandPaletteService>(COMMAND_PALETTE_SERVICE);
  const catalog = useInject<KeyboardCatalogService>(KEYBOARD_CATALOG_SERVICE);
  const hints = useInject<KeyboardHintsService>(KEYBOARD_HINTS_SERVICE);
  const config = useOptionalInject<KbdConfig>(KBD_CONFIG);
  const events = useInject<EventEmitter>(EVENT_EMITTER);

  // Wire navigation via events — no direct router dependency.
  useEffect(() => {
    const emitNavigate = (to: string) => events.emit(NavigationCommands.NAVIGATE, { path: to });
    listener.setNavigate(emitNavigate);
    palette.setNavigate(emitNavigate);
    return () => {
      listener.setNavigate(null);
      palette.setNavigate(null);
    };
  }, [listener, palette, events]);

  // Start / stop the global keydown listener.
  useEffect(() => {
    listener.start();
    return () => listener.stop();
  }, [listener]);

  // Register the built-in palette / catalog / hints shortcuts.
  useEffect(() => {
    const paletteCombo =
      config?.paletteShortcut === undefined ? { mod: true, key: "k" } : config.paletteShortcut;
    const catalogCombo =
      config?.catalogShortcut === undefined ? { shift: true, key: "?" } : config.catalogShortcut;
    const hintsCombo =
      config?.hintsShortcut === undefined ? { mod: true, key: "/" } : config.hintsShortcut;

    if (paletteCombo) {
      registry.registerShortcut({
        id: "kbd::open-palette",
        description: "Open command palette",
        type: "tool",
        combo: paletteCombo,
        allowInInput: true,
        handler: () => palette.toggle(),
      });
      listener.syncShortcut(registry.get("kbd::open-palette")!);
    }
    if (catalogCombo) {
      registry.registerShortcut({
        id: "kbd::open-catalog",
        description: "Show keyboard shortcuts",
        type: "tool",
        combo: catalogCombo,
        handler: () => catalog.toggle(),
      });
      listener.syncShortcut(registry.get("kbd::open-catalog")!);
    }
    if (hintsCombo) {
      registry.registerShortcut({
        id: "kbd::toggle-hints",
        description: "Toggle keyboard hints overlay",
        type: "tool",
        combo: hintsCombo,
        handler: () => hints.toggle(),
      });
      listener.syncShortcut(registry.get("kbd::toggle-hints")!);
    }

    return () => {
      listener.unregisterShortcut("kbd::open-palette");
      listener.unregisterShortcut("kbd::open-catalog");
      listener.unregisterShortcut("kbd::toggle-hints");
      registry.unregisterShortcut("kbd::open-palette");
      registry.unregisterShortcut("kbd::open-catalog");
      registry.unregisterShortcut("kbd::toggle-hints");
    };
  }, [config, registry, palette, catalog, hints]);

  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: { preventDefault: true },
        hotkeySequence: { timeout: config?.sequenceTimeoutMs ?? 1500 },
      }}
    >
      {children}
      <KeyboardHints />
      {devtools && <KbdDevtools />}
    </HotkeysProvider>
  );
}

/**
 * Lazy-loaded devtools component — only renders in development.
 */
function KbdDevtools(): ReactElement | null {
  const [DevtoolsEl, setDevtoolsEl] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (import.meta.env.PROD) return;

    Promise.all([
      import(/* @vite-ignore */ "@tanstack/react-devtools"),
      import(/* @vite-ignore */ "@tanstack/react-hotkeys-devtools"),
    ])
      .then(([{ TanStackDevtools }, { hotkeysDevtoolsPlugin }]) => {
        setDevtoolsEl(<TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />);
      })
      .catch(() => {
        // Devtools not available — silently skip
      });
  }, []);

  return DevtoolsEl;
}
