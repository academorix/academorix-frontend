/**
 * @file ai-assistant.service.ts
 * @module @academorix/dashboard/services/ai-assistant
 * @description Container-owned controller for the AI Assistant sheet.
 *
 *   Owns two pieces of state:
 *
 *   1. **Open state** — the sheet's boolean visibility. The navbar's
 *      Assistant icon calls `open()` from any page; the sheet mount
 *      subscribes and renders the `<AiAssistantSheet>` when it flips
 *      to `true`.
 *   2. **Slot registration** — the live `UseDashboardEditor` bound to
 *      the currently-visible dashboard. The dashboard page registers
 *      itself via `registerSlot()` on mount and clears on unmount.
 *
 *   ## Migration note
 *
 *   Replaces the legacy `<AiAssistantProvider>` context in
 *   `apps/dashboard/src/providers/ai-assistant-provider.tsx`. Public
 *   hooks (`useAiAssistantOpener()`, `useAiAssistantSlot()`) keep the
 *   same shape.
 *
 *   ## No-slot open behaviour
 *
 *   Calling `open()` while `slot === null` is a UX no-op — the mount
 *   component surfaces a friendly toast pointing the user at
 *   `/dashboard`. The service does NOT toast directly (services should
 *   not depend on HeroUI's toast singleton); it emits an
 *   `openRequested` signal that the mount observes to render the toast
 *   inside the React tree. The `isOpen` flag stays `false` in that
 *   case so the sheet does not attempt to render without an editor.
 */

import { Injectable, type OnApplicationShutdown } from "@stackra/container";

import type {
  IAiAssistantSlotRegistration,
  IAiAssistantSnapshot,
} from "./ai-assistant.interface";

/** Stable snapshot representing "no slot, closed". */
const EMPTY_SNAPSHOT: IAiAssistantSnapshot = { isOpen: false, slot: null };

/** Reactive AI Assistant sheet controller. */
@Injectable()
export class AiAssistantService implements OnApplicationShutdown {
  #snapshot: IAiAssistantSnapshot = EMPTY_SNAPSHOT;

  readonly #listeners = new Set<() => void>();

  /**
   * "Open requested but no slot" signal — a monotonically-increasing
   * counter the mount component watches via {@link getOpenRequestSnapshot}.
   * Bumped every time `open()` is called with `slot === null` so the
   * mount can render a toast reactively without inspecting the whole
   * snapshot.
   */
  #openRequestNoSlotCounter = 0;

  /** Fired on shutdown. Idempotent. */
  public onApplicationShutdown(): void {
    this.#listeners.clear();
    this.#snapshot = EMPTY_SNAPSHOT;
  }

  /** Subscribe to snapshot changes. */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);

    return (): void => {
      this.#listeners.delete(listener);
    };
  };

  /** Current snapshot — stable object identity between mutations. */
  public readonly getSnapshot = (): IAiAssistantSnapshot => this.#snapshot;

  /**
   * Read the monotonic "open requested but no slot" counter. The mount
   * component pairs this with a `useEffect` that watches the returned
   * value and toasts on each bump.
   */
  public readonly getOpenRequestNoSlotCounter = (): number =>
    this.#openRequestNoSlotCounter;

  /**
   * Open the sheet. When no editor slot is registered, bumps the
   * "open requested" counter without opening the sheet — the mount
   * component surfaces a toast pointing the user at `/dashboard`.
   */
  public readonly open = (): void => {
    if (this.#snapshot.slot === null) {
      // Bump the counter so the mount can react (toast). Notify
      // subscribers so the mount's `useSyncExternalStore` re-reads the
      // signal.
      this.#openRequestNoSlotCounter += 1;
      this.#emit();

      return;
    }

    if (this.#snapshot.isOpen) {
      return;
    }

    this.#snapshot = { isOpen: true, slot: this.#snapshot.slot };
    this.#emit();
  };

  /** Close the sheet. No-op if already closed. */
  public readonly close = (): void => {
    if (!this.#snapshot.isOpen) {
      return;
    }

    this.#snapshot = { isOpen: false, slot: this.#snapshot.slot };
    this.#emit();
  };

  /**
   * Sync `isOpen` from an external controller (the HeroUI sheet's
   * `onOpenChange` callback). Preserves the current slot.
   */
  public readonly setOpen = (open: boolean): void => {
    if (this.#snapshot.isOpen === open) {
      return;
    }

    this.#snapshot = { isOpen: open, slot: this.#snapshot.slot };
    this.#emit();
  };

  /**
   * Register (or clear) the current page's editor slot. Guards
   * structural equality so a caller who hands in the same registration
   * repeatedly doesn't cascade re-renders.
   *
   * Passing `null` unregisters. Auto-closes the sheet on unregister —
   * see the docblock in the legacy provider for why (opening the
   * sheet, routing away, then routing back would otherwise re-open the
   * sheet spuriously).
   */
  public readonly registerSlot = (
    registration: IAiAssistantSlotRegistration | null,
  ): void => {
    const previous = this.#snapshot.slot;

    // Structural equality — same editor + same isReadOnly → no-op.
    if (
      previous !== null &&
      registration !== null &&
      previous.editor === registration.editor &&
      previous.isReadOnly === registration.isReadOnly
    ) {
      return;
    }

    if (previous === null && registration === null) {
      return;
    }

    // Auto-close when the slot is cleared. Otherwise a route
    // navigation that unmounts the editor would leave `isOpen === true`
    // and the sheet would spring back open the next time an editor
    // mounted — surprising, not helpful.
    const isOpen = registration === null ? false : this.#snapshot.isOpen;

    this.#snapshot = { isOpen, slot: registration };
    this.#emit();
  };

  /** Emit — errors bubble; a bad subscriber is a bug. */
  #emit(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}
