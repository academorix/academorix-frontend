/**
 * @fileoverview KeyboardListenerService — TanStack Hotkeys adapter.
 *
 * Bridges the {@link ShortcutRegistry} with TanStack Hotkeys'
 * `HotkeyManager` and `SequenceManager`. Components register /
 * unregister shortcuts dynamically through the registry; this service
 * syncs those registrations into the TanStack engine.
 *
 * TanStack Hotkeys handles all event listening, preventDefault,
 * stopPropagation, and input element filtering internally via its
 * singleton managers. This service is purely a registration bridge.
 *
 * @module @stackra/kbd
 * @category Services
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import {
  getHotkeyManager,
  getSequenceManager,
  type HotkeyManager,
  type HotkeyRegistrationHandle,
  type SequenceManager,
  type Hotkey,
  type HotkeySequence,
} from "@tanstack/react-hotkeys";

import { KBD_CONFIG } from "../tokens";
import type { KbdModuleOptions } from "../interfaces/kbd-config.interface";
import type { KeyCombo } from "../interfaces/key-combo.interface";
import type { Shortcut } from "../interfaces/shortcut.interface";
import type { KbdNavigate } from "../types/kbd-navigate.type";
import { ShortcutRegistry } from "../registries/shortcut.registry";
import { comboToHotkeyString, sequenceToKeys } from "../utils/tanstack-adapter.util";

/**
 * Global keyboard listener backed by TanStack Hotkeys.
 *
 * Uses `HotkeyManager` for single-key combos and `SequenceManager`
 * for multi-key chord sequences. TanStack manages all DOM event
 * listeners internally — this service only bridges the ShortcutRegistry
 * to TanStack's registration API.
 */
@Injectable()
export class KeyboardListenerService {
  /** TanStack HotkeyManager singleton. */
  private manager: HotkeyManager | null = null;

  /** TanStack SequenceManager singleton. */
  private sequenceManager: SequenceManager | null = null;

  /** Map of shortcut id → cleanup functions for TanStack registrations. */
  private registrations = new Map<string, (() => void)[]>();

  /** Optional navigate fn — supplied through {@link setNavigate}. */
  private navigate: KbdNavigate | null = null;

  /** Whether the listener is currently active. */
  private active = false;

  public constructor(
    private readonly registry: ShortcutRegistry,
    @Optional() @Inject(KBD_CONFIG) private readonly config?: KbdModuleOptions,
  ) {}

  /**
   * Inject the navigate function used by route-style shortcuts.
   *
   * @param navigate - Router navigate function or `null` to clear.
   */
  public setNavigate(navigate: KbdNavigate | null): void {
    this.navigate = navigate;
  }

  /** Sequence buffer timeout in milliseconds. */
  private get sequenceTimeoutMs(): number {
    return this.config?.sequenceTimeoutMs ?? 1500;
  }

  /**
   * Initialize TanStack managers and sync all registered shortcuts.
   *
   * TanStack's HotkeyManager and SequenceManager are singletons that
   * manage their own document-level event listeners. We only need to
   * register our shortcuts with them.
   */
  public start(): void {
    if (typeof window === "undefined") return;
    if (this.active) return;

    this.manager = getHotkeyManager();
    this.sequenceManager = getSequenceManager();
    this.active = true;
    this.syncAll();
  }

  /**
   * Stop listening and clean up all TanStack registrations.
   */
  public stop(): void {
    if (!this.active) return;
    this.active = false;
    this.unregisterAll();
    this.manager = null;
    this.sequenceManager = null;
  }

  /**
   * Sync a single shortcut into TanStack Hotkeys.
   *
   * Determines whether the shortcut is a sequence or a single combo
   * and registers it with the appropriate TanStack manager.
   *
   * @param shortcut - The shortcut to register with TanStack.
   */
  public syncShortcut(shortcut: Shortcut): void {
    if (!this.active || !this.manager) return;

    // Remove previous registration for this id
    this.unregisterShortcut(shortcut.id);

    const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];
    const cleanups: (() => void)[] = [];

    for (const combo of combos) {
      const sequence = this.resolveSequence(combo);

      if (sequence && this.sequenceManager) {
        // Register as a multi-key sequence (e.g., G then H)
        const keys = sequenceToKeys(sequence) as HotkeySequence;
        const handle = this.sequenceManager.register(
          keys,
          (event: KeyboardEvent) => {
            void this.executeShortcut(shortcut, event);
          },
          { timeout: this.sequenceTimeoutMs },
        );
        // SequenceManager.register() returns a handle with .unregister()
        cleanups.push(() => {
          if (handle && typeof handle === "object" && "unregister" in handle) {
            (handle as any).unregister();
          } else if (typeof handle === "function") {
            (handle as any)();
          }
        });
      } else {
        // Register as a single hotkey combo (e.g., Mod+S)
        const hotkeyStr = comboToHotkeyString(combo);
        if (!hotkeyStr) continue;

        const handle: HotkeyRegistrationHandle = this.manager.register(
          hotkeyStr as Hotkey,
          (event: KeyboardEvent) => {
            void this.executeShortcut(shortcut, event);
          },
          {
            preventDefault: shortcut.preventDefault !== false,
            ignoreInputs: !shortcut.allowInInput,
          },
        );
        cleanups.push(() => handle.unregister());
      }
    }

    this.registrations.set(shortcut.id, cleanups);
  }

  /**
   * Remove a shortcut's TanStack registration.
   *
   * @param id - The shortcut id to unregister.
   */
  public unregisterShortcut(id: string): void {
    const cleanups = this.registrations.get(id);
    if (cleanups) {
      for (const cleanup of cleanups) cleanup();
      this.registrations.delete(id);
    }
  }

  /**
   * Re-sync all shortcuts from the registry into TanStack.
   */
  public syncAll(): void {
    if (!this.active || !this.manager) return;
    this.unregisterAll();

    for (const shortcut of this.registry.getAll()) {
      this.syncShortcut(shortcut);
    }
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Execute a shortcut's action (handler or navigation).
   *
   * @param shortcut - The matched shortcut.
   * @param event - The triggering keyboard event.
   */
  private async executeShortcut(shortcut: Shortcut, event: KeyboardEvent): Promise<void> {
    if ("handler" in shortcut && shortcut.handler) {
      await shortcut.handler(event);
      return;
    }
    if ("to" in shortcut && shortcut.to && this.navigate) {
      this.navigate(shortcut.to);
    }
  }

  /**
   * Resolve the sequence keys from a combo (if it defines a sequence).
   *
   * @param combo - The key combo to inspect.
   * @returns Array of key strings for the sequence, or `undefined` if not a sequence.
   */
  private resolveSequence(combo: KeyCombo): string[] | undefined {
    if (combo.sequence && combo.sequence.length > 0) {
      return combo.sequence;
    }
    if (combo.keys) {
      const isMacPlatform =
        typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      if (isMacPlatform && combo.keys.mac) return combo.keys.mac;
      if (!isMacPlatform && combo.keys.windows) return combo.keys.windows;
      if (combo.keys.linux) return combo.keys.linux;
      const first = Object.values(combo.keys).find(
        (arr): arr is string[] => Array.isArray(arr) && arr.length > 0,
      );
      return first;
    }
    return undefined;
  }

  /**
   * Remove all TanStack registrations.
   */
  private unregisterAll(): void {
    for (const cleanups of this.registrations.values()) {
      for (const cleanup of cleanups) cleanup();
    }
    this.registrations.clear();
  }
}
