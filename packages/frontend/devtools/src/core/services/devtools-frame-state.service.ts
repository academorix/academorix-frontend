/**
 * @file devtools-frame-state.service.ts
 * @module @stackra/devtools/core/services
 * @description Persists devtools frame state (open state, active
 *   panel id, drawer position/size, inspector toggle) to
 *   `@stackra/storage` when available.
 *
 *   Every field is optional-with-default at read time — the service
 *   fails soft when `@stackra/storage` isn't wired, when the
 *   configured instance is missing, or when the stored payload
 *   fails to parse. Consumers get a fresh frame state on any of
 *   those paths instead of a thrown error.
 */

import { Inject, Injectable, Optional, type OnModuleInit } from "@stackra/container";
import { STORAGE_MANAGER, type IStorage, type IStorageManager } from "@stackra/contracts";

import { DEFAULT_DEVTOOLS_CONFIG, DEVTOOLS_CONFIG, DEVTOOLS_FRAME_STATE_KEY } from "../constants";
import type { IDevtoolsFrameState } from "../interfaces/devtools-frame-state.interface";
import type { IDevtoolsModuleOptions } from "../interfaces/devtools-module-options.interface";
import type { DevtoolsShellPosition } from "../types/devtools-shell-position.type";

/** Listener fired when the persisted state changes. */
export type DevtoolsFrameStateListener = () => void;

/**
 * Build the seed frame state from the merged module config — used
 * when no persisted snapshot exists yet.
 */
function seedFromConfig(config: IDevtoolsModuleOptions): IDevtoolsFrameState {
  return {
    isOpen: false,
    activePanelId: null,
    position:
      (config.position as DevtoolsShellPosition | undefined) ??
      (DEFAULT_DEVTOOLS_CONFIG.position as DevtoolsShellPosition),
    size: config.initialSize ?? DEFAULT_DEVTOOLS_CONFIG.initialSize ?? 480,
    isInspectorEnabled: false,
    searchQuery: "",
  };
}

/**
 * Persistence + in-memory state for the devtools frame.
 *
 * Consumers read state via `getSnapshot()` and subscribe to
 * mutations with `subscribe(listener)` — matches the
 * `useSyncExternalStore` shape the React hooks bind to.
 */
@Injectable()
export class DevtoolsFrameStateService implements OnModuleInit {
  private state: IDevtoolsFrameState;

  private readonly listeners = new Set<DevtoolsFrameStateListener>();

  /**
   * Cached `IStorage` reference — resolved once from the
   * manager on `onModuleInit`. Left `null` when `@stackra/storage`
   * isn't wired.
   */
  private storage: IStorage | null = null;

  public constructor(
    @Inject(DEVTOOLS_CONFIG) private readonly config: IDevtoolsModuleOptions,
    @Optional() @Inject(STORAGE_MANAGER) private readonly manager?: IStorageManager,
  ) {
    this.state = seedFromConfig(config);
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /**
   * Resolve the configured storage instance and hydrate the state.
   *
   * Runs on `onModuleInit` so both the panels registry AND the
   * storage manager have wired their providers by the time we
   * touch either — no ordering surprise.
   */
  public onModuleInit(): void {
    // Resolve the configured instance from the manager. When
    // `@stackra/storage` isn't installed the whole block is a
    // no-op — the state stays seeded from config.
    if (this.manager) {
      try {
        const name = this.config.storage ?? DEFAULT_DEVTOOLS_CONFIG.storage;
        this.storage = this.manager.instance(name);
      } catch {
        // fail-soft — the configured instance may not exist yet
        // (e.g. wrong name in dev config); we behave as if
        // storage were absent.
        this.storage = null;
      }
    }
    // Attempt hydration — a missing key or a parse error both
    // fall back to the seed state.
    this.hydrate();
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * @returns The current frame state (immutable snapshot).
   */
  public getSnapshot(): IDevtoolsFrameState {
    return this.state;
  }

  /**
   * Merge `partial` into the current state, persist, and notify
   * subscribers.
   *
   * @param partial - Fields to update.
   */
  public update(partial: Partial<IDevtoolsFrameState>): void {
    const next: IDevtoolsFrameState = { ...this.state, ...partial };
    // Bail out if nothing actually changed — a no-op update must
    // not spuriously notify subscribers.
    if (this.shallowEqual(this.state, next)) return;
    this.state = next;
    this.persist();
    this.notify();
  }

  /**
   * Subscribe to state mutations. Returns an unsubscribe fn.
   */
  public subscribe(listener: DevtoolsFrameStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ──────────────────────────────────────────────────────

  private hydrate(): void {
    if (!this.storage) return;
    try {
      // `IStorage.get` may return `null | undefined | string` or the
      // deserialised object depending on the driver — we handle
      // both shapes.
      const raw = (this.storage.get as (k: string) => unknown)(DEVTOOLS_FRAME_STATE_KEY);
      if (raw === null || raw === undefined) return;

      let parsed: unknown = raw;
      if (typeof raw === "string") {
        parsed = JSON.parse(raw);
      }
      if (!parsed || typeof parsed !== "object") return;

      // Merge over the seed rather than replacing wholesale so a
      // stored snapshot missing a newer field doesn't corrupt the
      // current shape.
      this.state = { ...this.state, ...(parsed as Partial<IDevtoolsFrameState>) };
    } catch {
      // fail-soft — a corrupted snapshot must not stall bootstrap.
    }
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      // Storage drivers vary: some accept an object and serialise
      // internally, some require a string. We serialise here to be
      // safe against the string-only drivers (localStorage).
      (this.storage.set as (k: string, v: unknown) => unknown)(
        DEVTOOLS_FRAME_STATE_KEY,
        JSON.stringify(this.state),
      );
    } catch {
      // fail-soft — a failed persist must not block the UI update.
    }
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch {
        // fail-soft — one broken subscriber cannot block the rest.
      }
    }
  }

  /**
   * Shallow-equality check tailored to `IDevtoolsFrameState` — every
   * field is a primitive except `activePanelId` (null-able string)
   * so a naive `===` walk is sufficient.
   */
  private shallowEqual(a: IDevtoolsFrameState, b: IDevtoolsFrameState): boolean {
    return (
      a.isOpen === b.isOpen &&
      a.activePanelId === b.activePanelId &&
      a.position === b.position &&
      a.size === b.size &&
      a.isInspectorEnabled === b.isInspectorEnabled &&
      a.searchQuery === b.searchQuery
    );
  }
}
