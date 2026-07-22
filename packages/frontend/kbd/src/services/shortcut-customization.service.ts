/**
 * @file shortcut-customization.service.ts
 * @module @stackra/kbd/services
 * @description ShortcutCustomizationService — user-customizable shortcuts.
 *
 *   Allows end-users to remap keyboard shortcuts at runtime. Overrides
 *   are persisted to a named `IStorage` instance from `@stackra/storage`
 *   (defaults to `"localStorage"`) and restored on `onModuleInit`.
 *
 *   The service integrates with the {@link ShortcutRegistry} to apply
 *   overrides live — changes take effect immediately without a page
 *   reload.
 */

import { Inject, Injectable, Optional, type OnModuleInit } from "@stackra/container";
import { STORAGE_MANAGER, type IStorageManager } from "@stackra/contracts";
import { Str } from "@stackra/support";

import { SHORTCUT_REGISTRY } from "../tokens";
import type { KeyCombo } from "../interfaces/key-combo.interface";
import type { Shortcut } from "../interfaces/shortcut.interface";
import type { ShortcutRegistry } from "../registries/shortcut.registry";

/**
 * Storage key used for persisting shortcut overrides. All entries land
 * under this single key as a JSON blob so a page reload restores every
 * customization in one read.
 */
const STORAGE_KEY = "kbd:overrides";

/**
 * Name of the `IStorage` instance used for persistence. Consumers can
 * mount a different driver (e.g. `sessionStorage`, `memory` in tests)
 * on this instance name and this service picks it up unchanged.
 */
const STORAGE_INSTANCE = "localStorage";

/**
 * Serialized override entry — the shape written to storage per shortcut id.
 */
interface SerializedOverride {
  /** The user-defined combo (or list of combos) replacing the default. */
  combo: KeyCombo | KeyCombo[];
}

/**
 * Conflict check result returned by
 * {@link ShortcutCustomizationService.checkConflict}.
 */
export interface ShortcutConflict {
  /** The shortcut that already uses this combo. */
  shortcut: Shortcut;
  /** The conflicting combo. */
  combo: KeyCombo;
}

/**
 * Service for managing user-customizable keyboard shortcuts.
 *
 * Provides recording, conflict detection, persistence, and live
 * application of shortcut overrides. Persistence flows through
 * `@stackra/storage`'s named instance API — never a direct
 * `localStorage.*` call (see steering `storage-usage.md`).
 */
@Injectable()
export class ShortcutCustomizationService implements OnModuleInit {
  /**
   * Map of shortcut id → custom combo override.
   */
  private overrides = new Map<string, KeyCombo | KeyCombo[]>();

  /**
   * Map of shortcut id → original (default) combo.
   */
  private defaults = new Map<string, KeyCombo | KeyCombo[]>();

  /**
   * Listeners notified when overrides change.
   */
  private listeners = new Set<() => void>();

  public constructor(
    @Inject(SHORTCUT_REGISTRY) private readonly registry: ShortcutRegistry,
    // The storage manager is an optional peer — headless test harnesses
    // (and any consumer that hasn't imported `StorageModule.forRoot`)
    // still get a functional service, they just don't get persistence.
    @Optional()
    @Inject(STORAGE_MANAGER)
    private readonly storage?: IStorageManager,
  ) {}

  /**
   * Load persisted overrides after the container has finished wiring
   * every module. `onModuleInit` — not the constructor — because the
   * `IStorage` API is asynchronous and constructors cannot await.
   */
  public async onModuleInit(): Promise<void> {
    await this.loadOverrides();
  }

  /**
   * Set a custom combo for a shortcut.
   *
   * @param shortcutId - The shortcut to customize.
   * @param combo - The new combo(s) to assign.
   */
  public setCustomCombo(shortcutId: string, combo: KeyCombo | KeyCombo[]): void {
    // Store the default the first time we override a shortcut so
    // `resetToDefault` always has a target to revert to.
    if (!this.defaults.has(shortcutId)) {
      const existing = this.registry.get(shortcutId);
      if (existing) {
        this.defaults.set(shortcutId, existing.combo);
      }
    }

    this.overrides.set(shortcutId, combo);
    this.applyOverride(shortcutId, combo);
    // Persist fire-and-forget — the caller shouldn't have to await the
    // storage round-trip. Errors are swallowed by `persist()` itself.
    void this.persist();
    this.notify();
  }

  /**
   * Reset a single shortcut to its default combo.
   *
   * @param shortcutId - The shortcut to reset.
   */
  public resetToDefault(shortcutId: string): void {
    const defaultCombo = this.defaults.get(shortcutId);
    if (!defaultCombo) return;

    this.overrides.delete(shortcutId);
    this.applyOverride(shortcutId, defaultCombo);
    void this.persist();
    this.notify();
  }

  /**
   * Reset all shortcuts to their defaults.
   */
  public resetAllToDefaults(): void {
    for (const [id, defaultCombo] of this.defaults) {
      this.applyOverride(id, defaultCombo);
    }
    this.overrides.clear();
    void this.persist();
    this.notify();
  }

  /**
   * Check if a combo conflicts with an existing shortcut.
   *
   * @param shortcutId - The shortcut being customized (excluded from check).
   * @param combo - The combo to check for conflicts.
   * @returns The conflicting shortcut + combo, or `null` if no conflict.
   */
  public checkConflict(shortcutId: string, combo: KeyCombo): ShortcutConflict | null {
    for (const shortcut of this.registry.getAll()) {
      if (shortcut.id === shortcutId) continue;

      const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];
      for (const existing of combos) {
        if (this.combosMatch(combo, existing)) {
          return { shortcut, combo: existing };
        }
      }
    }
    return null;
  }

  /**
   * Get the current combo for a shortcut (override or default).
   *
   * @param shortcutId - The shortcut id to look up.
   */
  public getCombo(shortcutId: string): KeyCombo | KeyCombo[] | undefined {
    return this.overrides.get(shortcutId) ?? this.defaults.get(shortcutId);
  }

  /**
   * Whether a shortcut has been customized.
   */
  public isCustomized(shortcutId: string): boolean {
    return this.overrides.has(shortcutId);
  }

  /**
   * Get all current overrides.
   */
  public getOverrides(): ReadonlyMap<string, KeyCombo | KeyCombo[]> {
    return this.overrides;
  }

  /**
   * Subscribe to override changes. Returns an unsubscribe function.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /* ── Internal ───────────────────────────────────────────────── */

  /**
   * Apply an override to the registry (updates the shortcut in-place).
   */
  private applyOverride(shortcutId: string, combo: KeyCombo | KeyCombo[]): void {
    const shortcut = this.registry.get(shortcutId);
    if (!shortcut) return;

    // Re-register with the new combo — the registry is last-wins keyed
    // by id so overwriting is safe and cheap.
    this.registry.registerShortcut({ ...shortcut, combo });
  }

  /**
   * Compare two combos for equality.
   */
  private combosMatch(a: KeyCombo, b: KeyCombo): boolean {
    // Sequence comparison
    if (a.sequence && b.sequence) {
      if (a.sequence.length !== b.sequence.length) return false;
      return a.sequence.every(
        (k, i) => Str.lower(k) === (b.sequence![i] ? Str.lower(b.sequence![i]!) : undefined),
      );
    }

    // Single key comparison
    if (a.key && b.key) {
      return (
        Str.lower(a.key) === Str.lower(b.key) &&
        !!a.mod === !!b.mod &&
        !!a.ctrl === !!b.ctrl &&
        !!a.meta === !!b.meta &&
        !!a.alt === !!b.alt &&
        !!a.shift === !!b.shift
      );
    }

    return false;
  }

  /**
   * Load overrides from storage on bootstrap.
   *
   * Reads persisted shortcut overrides through the injected
   * `IStorageManager` and applies them to the registry. Shortcut
   * overrides are user preferences owned by this service — they are
   * not reactive state and do not flow through `StateModule`.
   *
   * Fail-soft: if the storage manager is not mounted (headless test
   * harness) or the stored value is corrupted, this method returns
   * silently without applying any overrides.
   *
   * @internal
   */
  private async loadOverrides(): Promise<void> {
    if (!this.storage) return;

    try {
      // Read the whole override map as one JSON blob. The IStorage
      // contract is generic — `.get<T>(key)` returns `T | undefined`.
      const stored = await this.storage
        .instance(STORAGE_INSTANCE)
        .get<Record<string, SerializedOverride>>(STORAGE_KEY);
      if (!stored) return;

      for (const [id, override] of Object.entries(stored)) {
        this.overrides.set(id, override.combo);

        // Store the current default before applying so a later
        // `resetToDefault` can revert.
        const existing = this.registry.get(id);
        if (existing) {
          this.defaults.set(id, existing.combo);
          this.applyOverride(id, override.combo);
        }
      }
    } catch {
      // fail-soft — storage may be unavailable (private mode), the
      // blob may be corrupted, or the driver may throw. Overrides
      // stay empty; the user simply loses their customizations.
    }
  }

  /**
   * Persist overrides to storage.
   *
   * Serializes the current override map to the named `IStorage`
   * instance. Called after every mutation (set, reset, resetAll) so
   * overrides survive a page reload.
   *
   * @internal
   */
  private async persist(): Promise<void> {
    if (!this.storage) return;

    try {
      const entries: Record<string, SerializedOverride> = {};
      for (const [id, combo] of this.overrides) {
        entries[id] = { combo };
      }
      await this.storage.instance(STORAGE_INSTANCE).set(STORAGE_KEY, entries);
    } catch {
      // fail-soft — storage may be full or unavailable. The in-memory
      // state is still authoritative; the user just won't get
      // persistence across reloads.
    }
  }

  /**
   * Notify all listeners of a change.
   */
  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
