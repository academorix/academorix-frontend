/**
 * @file ai-assistant-provider.tsx
 * @module providers/ai-assistant-provider
 *
 * @description
 * A workspace-wide provider that owns the AI Assistant sheet's
 * open/close state and its bound `UseDashboardEditor`. The
 * navbar's Assistant icon (`app-navbar.tsx`) calls `open()` to
 * pop the sheet from any page; the dashboard page (which owns
 * the editor) registers itself via {@link useAiAssistantSlot} on
 * mount.
 *
 * ### Why a provider (Option A)
 *
 * The alternative — keeping the sheet mounted inside
 * `dashboard.tsx` and passing an `open` handler down via a
 * lightweight context — works but leaves the sheet unreachable
 * from any page outside `/dashboard`. Every replacement for
 * that shortcut ends up looking like this provider anyway, so
 * we ship the full separation up-front:
 *
 * - The **sheet** lives inside this provider and is mounted at
 *   the App level, so it's globally reachable.
 * - The **editor** is the only per-page state; it's registered
 *   by the dashboard route via `useAiAssistantSlot(editor)` on
 *   mount and torn down on unmount. Read-only mode piggybacks
 *   on the same registration.
 * - When no editor is registered, `open()` emits a toast
 *   pointing the user at `/dashboard` and no-ops the sheet.
 *   This deliberately avoids forced navigation — a
 *   context-appropriate hint is friendlier than a mystery jump.
 *
 * All three surfaces (open, editor registration, sheet
 * rendering) share one context so any consumer can subscribe
 * with a narrow read (`useAiAssistantOpener()` for the navbar,
 * `useAiAssistantSlot()` for the dashboard).
 */

import { toast } from "@heroui/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { AiAssistantSheet } from "@/modules/dashboard/components/ai-assistant-sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The registration passed into the provider when a page mounts
 * that owns a live editor. Kept as an object (not two positional
 * args) so future flags (e.g. "auto-open on register") can land
 * without a signature change.
 */
export interface AiAssistantSlotRegistration {
  /** The editor currently bound to the on-screen dashboard. */
  editor: UseDashboardEditor;
  /**
   * Whether the current dashboard is read-only. Built-in
   * dashboards flip this on — the sheet still opens (so users
   * can chat with the assistant) but suggestion application is
   * gated.
   */
  isReadOnly: boolean;
}

/**
 * The full context surface. Individual consumer hooks read a
 * narrow slice (see the type-checked helpers below) — the raw
 * shape is exported so power-user code that needs everything
 * (tests, e2e helpers) can subscribe once.
 */
export interface AiAssistantContextValue {
  /** Whether the assistant sheet is currently open. */
  isOpen: boolean;
  /** Pop the sheet. Emits a toast when no editor is registered. */
  open: () => void;
  /** Close the sheet. */
  close: () => void;
  /**
   * Register the current-page editor so the sheet has something
   * to talk to. Pass `null` (or call the returned cleanup) to
   * unregister on unmount.
   */
  registerSlot: (registration: AiAssistantSlotRegistration | null) => void;
  /** The active editor, if any. */
  slot: AiAssistantSlotRegistration | null;
}

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * The provider component. Wrap the authenticated shell so every
 * route can reach the assistant via `useAiAssistantOpener()`.
 * Mount OUTSIDE routing (App-level) so navigation between
 * dashboard slugs never re-mounts the provider — the current
 * page's registration is torn down and re-created by
 * `useAiAssistantSlot()`, but the provider itself stays alive.
 */
export function AiAssistantProvider({ children }: { children: ReactNode }): ReactNode {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [slot, setSlot] = useState<AiAssistantSlotRegistration | null>(null);

  /**
   * Keep the "latest slot" in a ref alongside the state copy.
   * The `open()` handler is stable (memoised with no deps) so
   * consumers can bind it to a keyboard shortcut without
   * re-registering the listener every render. Reading the slot
   * through a ref inside the stable handler lets us keep both
   * properties without sacrificing correctness.
   */
  const slotRef = useRef<AiAssistantSlotRegistration | null>(null);

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);

  const registerSlot = useCallback((registration: AiAssistantSlotRegistration | null) => {
    // WHY the structural bail: `useAiAssistantSlot` calls this
    // from an effect whose dep array watches the caller's
    // `editor` identity. Even after we've memoised the editor
    // upstream, defensive equality guards here prevent any
    // caller that hands us a fresh-per-render editor from
    // pushing the provider into a re-render loop. Comparing the
    // fields we care about (editor identity + isReadOnly)
    // instead of a deep compare keeps the check cheap.
    setSlot((prev) => {
      if (prev === registration) return prev;
      if (
        prev !== null &&
        registration !== null &&
        prev.editor === registration.editor &&
        prev.isReadOnly === registration.isReadOnly
      ) {
        return prev;
      }

      return registration;
    });
  }, []);

  // WHY auto-close when the slot goes null: if the user opens
  // the sheet on `/dashboard`, then routes away, the parent
  // page unmounts and de-registers its slot. Leaving `isOpen`
  // set to `true` would make the sheet spring back open the
  // next time the user returned to a dashboard — surprising,
  // not helpful. Snapping the state to `false` on de-register
  // keeps the open/close signal intentional every time.
  useEffect(() => {
    if (slot === null) {
      setIsOpen(false);
    }
  }, [slot]);

  const open = useCallback(() => {
    // WHY the toast fallback: when there's no editor registered
    // (any non-dashboard route) opening the sheet would render
    // a chat surface with nothing to change. A short-lived toast
    // pointing the user at `/dashboard` gives them a next step
    // without stealing focus or navigating them by force.
    if (slotRef.current === null) {
      toast("Open a dashboard first", {
        description: "The assistant is scoped to a dashboard editor. Head to /dashboard to start.",
      });

      return;
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AiAssistantContextValue>(
    () => ({ isOpen, open, close, registerSlot, slot }),
    [isOpen, open, close, registerSlot, slot],
  );

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      {/*
       * WHY the guard: `AiAssistantSheet` requires a non-null
       * editor at mount, so we defer rendering it until a slot
       * registers. `isOpen` guards additionally so we don't pay
       * the sheet's overlay + transition cost on every page
       * load — only when the user asks for it.
       */}
      {slot !== null ? (
        <AiAssistantSheet
          editor={slot.editor}
          isOpen={isOpen}
          isReadOnly={slot.isReadOnly}
          onOpenChange={setIsOpen}
        />
      ) : null}
    </AiAssistantContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hooks
// ---------------------------------------------------------------------------

/**
 * Read the raw context. Prefer the narrow helpers below unless a
 * consumer legitimately needs the full surface.
 */
function useAiAssistantContext(): AiAssistantContextValue {
  const ctx = useContext(AiAssistantContext);

  if (ctx === null) {
    throw new Error("useAiAssistant* hooks must be used inside <AiAssistantProvider>.");
  }

  return ctx;
}

/**
 * The narrow surface bound to the navbar's Assistant icon: a
 * single `open()` handler plus the current open state so the
 * navbar can style itself as pressed while the sheet is up.
 *
 * @example
 * ```tsx
 * const {open, isOpen} = useAiAssistantOpener();
 * <Button aria-pressed={isOpen} onPress={open}>Assistant</Button>
 * ```
 */
export function useAiAssistantOpener(): { open: () => void; close: () => void; isOpen: boolean } {
  const { open, close, isOpen } = useAiAssistantContext();

  return { open, close, isOpen };
}

/**
 * Register the current page's editor with the assistant slot.
 * Call from a page that owns a live `UseDashboardEditor` (today
 * only the dashboard route) — the hook takes care of
 * unregistering on unmount so route changes don't leak stale
 * editors into the sheet.
 *
 * @example
 * ```tsx
 * useAiAssistantSlot(editor, {isReadOnly: current.isBuiltIn});
 * ```
 */
export function useAiAssistantSlot(
  editor: UseDashboardEditor | null,
  options: { isReadOnly: boolean } = { isReadOnly: false },
): void {
  const { registerSlot } = useAiAssistantContext();

  useEffect(() => {
    if (editor === null) {
      registerSlot(null);

      return undefined;
    }

    registerSlot({ editor, isReadOnly: options.isReadOnly });

    return () => {
      registerSlot(null);
    };
    // WHY listing `options.isReadOnly` explicitly (not `options`):
    // the caller usually passes a fresh object literal every
    // render (`{isReadOnly: current.isBuiltIn}`). Depending on
    // the object identity would re-register on every parent
    // render — depending on the primitive is enough and stable.
  }, [editor, options.isReadOnly, registerSlot]);
}
