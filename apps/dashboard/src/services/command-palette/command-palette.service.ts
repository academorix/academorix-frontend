/**
 * @file command-palette.service.ts
 * @module @academorix/dashboard/services/command-palette
 * @description Container-owned ⌘K palette state + global shortcut.
 *
 *   Owns the palette open/close state and installs a document-level
 *   `keydown` listener that toggles the palette on `Cmd/Ctrl+K` from
 *   anywhere in the authenticated shell. Consumers read + drive the state
 *   through `useCommandPalette()`; the palette UI (`<CommandPalette />`)
 *   subscribes via `useSyncExternalStore` and renders when `isOpen`
 *   flips to `true`.
 *
 *   ## Migration note
 *
 *   Replaces the legacy `<CommandPaletteProvider>` context in
 *   `apps/dashboard/src/providers/command-palette-provider.tsx`. The
 *   public `useCommandPalette()` hook keeps the same shape.
 *
 *   ## Keyboard listener contract
 *
 *   The listener is installed in `onModuleInit` and torn down in
 *   `onApplicationShutdown`. It respects the "don't steal from form
 *   fields" convention every other shortcut in the shell uses — a user
 *   typing into an `<input>` / `<textarea>` / `[contenteditable]` sees
 *   the keystroke pass through unmolested.
 */

import { Injectable, type OnApplicationShutdown, type OnModuleInit } from "@stackra/container";

import type { ICommandPaletteSnapshot } from "./command-palette.interface";

/** Reused stable snapshot for the closed state. */
const CLOSED_SNAPSHOT: ICommandPaletteSnapshot = { isOpen: false };

/** Reused stable snapshot for the open state. */
const OPEN_SNAPSHOT: ICommandPaletteSnapshot = { isOpen: true };

/** Reactive ⌘K palette controller. */
@Injectable()
export class CommandPaletteService implements OnModuleInit, OnApplicationShutdown {
  #snapshot: ICommandPaletteSnapshot = CLOSED_SNAPSHOT;

  readonly #listeners = new Set<() => void>();

  /** Unsubscriber for the document-level `keydown` listener. */
  #keydownCleanup: (() => void) | null = null;

  /**
   * Fired once after the module graph resolves. Installs the global
   * ⌘K listener.
   *
   * Idempotent — `onApplicationShutdown` clears the cleanup, and
   * re-mounts do nothing if the listener is already attached.
   */
  public onModuleInit(): void {
    this.#installKeyboardListener();
  }

  /**
   * Fired on shutdown. Detaches the keyboard listener and drops
   * subscribers.
   */
  public onApplicationShutdown(): void {
    this.#keydownCleanup?.();
    this.#keydownCleanup = null;
    this.#listeners.clear();
    this.#snapshot = CLOSED_SNAPSHOT;
  }

  /** Subscribe to state changes. Returns unsubscriber. */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);

    return (): void => {
      this.#listeners.delete(listener);
    };
  };

  /** Current snapshot — stable object identity between mutations. */
  public readonly getSnapshot = (): ICommandPaletteSnapshot => this.#snapshot;

  /** Open the palette. No-op if already open. */
  public readonly open = (): void => {
    if (this.#snapshot.isOpen) {
      return;
    }

    this.#snapshot = OPEN_SNAPSHOT;
    this.#emit();
  };

  /** Close the palette. No-op if already closed. */
  public readonly close = (): void => {
    if (!this.#snapshot.isOpen) {
      return;
    }

    this.#snapshot = CLOSED_SNAPSHOT;
    this.#emit();
  };

  /** Toggle the palette. */
  public readonly toggle = (): void => {
    this.#snapshot = this.#snapshot.isOpen ? CLOSED_SNAPSHOT : OPEN_SNAPSHOT;
    this.#emit();
  };

  /**
   * Install the global `Cmd/Ctrl+K` listener. Guards against SSR / test
   * environments without a document.
   *
   * The listener respects the standard "don't steal from form fields"
   * convention — a Cmd+K keystroke inside an `<input>` / `<textarea>` /
   * `[contenteditable]` passes through so power users typing in a form
   * don't lose their input to the palette.
   */
  #installKeyboardListener(): void {
    // Guard for SSR / Node test environments.
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const listener = (event: KeyboardEvent): void => {
      const isModifier = event.metaKey || event.ctrlKey;
      const isK = event.key === "k" || event.key === "K";

      if (!isModifier || !isK) {
        return;
      }

      // Don't steal from form fields.
      if (CommandPaletteService.#isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      this.toggle();
    };

    window.addEventListener("keydown", listener);
    this.#keydownCleanup = (): void => window.removeEventListener("keydown", listener);
  }

  /** Emit — errors bubble; a bad subscriber is a bug. */
  #emit(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }

  /**
   * Whether the event target is an editable element (input / textarea /
   * contenteditable / select). Kept static so the guard is a pure
   * function of its input.
   */
  static #isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    const tag = target.tagName;

    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }
}
