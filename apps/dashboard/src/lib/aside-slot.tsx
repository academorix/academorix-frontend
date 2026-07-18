/**
 * @file aside-slot.tsx
 * @module lib/aside-slot
 *
 * @description
 * A tiny publish/subscribe store that lets any route control what shows
 * up in the shell's right-hand aside slot. The store holds a stable
 * **renderer function** (not a pre-rendered React element) plus an
 * `isOpen` flag; AppShell subscribes and renders the aside on demand.
 *
 * ## Why renderer + subscription instead of `setContent(<Panel/>)`
 *
 * React 19's reconciler is stricter about mounting/unmounting elements
 * that live in state slots than 18 was. The earlier implementation
 * stored a React element and re-set it whenever the route's props
 * changed. That triggered short-lived unmount → remount cycles which,
 * inside HeroUI Pro's Resizable + Portal-heavy aside, surfaced as
 * `nextResource.createElementNS is not a function` from React's own
 * SVG resource hoister.
 *
 * The renderer pattern fixes that by:
 *
 *   1. Keeping ONE fiber for the panel across route renders — the
 *      wrapper component that AppShell renders reads the current
 *      renderer via `useSyncExternalStore` and calls it during its
 *      own render pass. No element churn, no remount.
 *   2. Decoupling registration from render — routes can `subscribe`
 *      the renderer once and update via an internal ref, or call
 *      `setRenderer()` on effect dep change without producing a new
 *      React element every time.
 *   3. Making the store side-effect-free from the AppShell's angle —
 *      subscribers hear about changes through
 *      `useSyncExternalStore`, the React-blessed teardown-safe
 *      external subscription primitive.
 *
 * Consumers never touch the store directly — they use
 * {@link useRegisterAsideContent} to publish and
 * {@link useAsideSlot} to read the open state / toggle handlers.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { ReactNode } from "react";

/** A renderer produces the current aside content on demand. */
type AsideRenderer = () => ReactNode;

/** Snapshot handed to `useSyncExternalStore` consumers. */
interface AsideSnapshot {
  renderer: AsideRenderer | null;
  isOpen: boolean;
  /**
   * Monotonic revision counter bumped by {@link AsideStore.notifyContentChanged}.
   *
   * The registered `renderer` is a stable wrapper whose identity
   * never changes across route renders — it always calls
   * `renderRef.current()`, which closes over the latest editor +
   * dashboard state. That means `renderer()` returns a fresh React
   * tree on every invocation, but the store had no way of knowing
   * the underlying closure had changed: `snapshot.renderer` stayed
   * referentially equal, so `useSyncExternalStore` never re-fired
   * and AppShell never re-rendered the aside.
   *
   * The revision counter is the "content changed" signal — it lets
   * the register hook wake the store up on every route render
   * without inventing a new renderer reference each time. `renderer`
   * itself stays stable so consumer effects with `renderer` in their
   * deps don't churn.
   */
  revision: number;
}

/**
 * The external store. Kept as a plain object with a listener set so
 * we don't pull in any state library for a 40-line indirection.
 */
interface AsideStore {
  getSnapshot: () => AsideSnapshot;
  subscribe: (listener: () => void) => () => void;
  setRenderer: (renderer: AsideRenderer | null) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /**
   * Signal that the registered renderer's closure state may have
   * changed even though the renderer reference is the same. Bumps
   * {@link AsideSnapshot.revision}, which is enough to trip
   * `useSyncExternalStore` into re-firing every subscriber.
   */
  notifyContentChanged: () => void;
}

function createAsideStore(): AsideStore {
  let snapshot: AsideSnapshot = { renderer: null, isOpen: false, revision: 0 };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    setRenderer: (renderer) => {
      if (snapshot.renderer === renderer) return;

      snapshot = { ...snapshot, renderer };
      notify();
    },
    setOpen: (open) => {
      if (snapshot.isOpen === open) return;

      snapshot = { ...snapshot, isOpen: open };
      notify();
    },
    toggle: () => {
      snapshot = { ...snapshot, isOpen: !snapshot.isOpen };
      notify();
    },
    notifyContentChanged: () => {
      // Bump the revision — `useSyncExternalStore` uses the
      // snapshot's identity to decide whether to re-fire subscribers,
      // so a fresh object reference is enough. The registered
      // renderer is intentionally left untouched so consumer effects
      // that depend on `renderer` don't churn.
      snapshot = { ...snapshot, revision: snapshot.revision + 1 };
      notify();
    },
  };
}

const AsideSlotContext = createContext<AsideStore | null>(null);

export function AsideSlotProvider({ children }: { children: ReactNode }): ReactNode {
  // A single store per provider tree — memoised so React sees a stable
  // reference across renders.
  const store = useMemo(() => createAsideStore(), []);

  return <AsideSlotContext.Provider value={store}>{children}</AsideSlotContext.Provider>;
}

/**
 * Public read handle: gets the current aside `isOpen` flag, the
 * current renderer, and helpers to change either. Returns a stable
 * object identity every render — safe to depend on inside effects
 * without triggering re-runs.
 */
export interface AsideSlotHandle {
  isOpen: boolean;
  content: ReactNode;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /**
   * Publish a stable renderer function. The renderer must close
   * over refs / stable state, not per-render values, because the
   * store keeps the same reference until you call setRenderer with
   * a new one.
   *
   * Prefer {@link useRegisterAsideContent} — it wraps the ref +
   * lifecycle in a single hook.
   */
  setRenderer: (renderer: AsideRenderer | null) => void;
  /**
   * Signal that the registered renderer's closure state may have
   * changed. Used by {@link useRegisterAsideContent} once per
   * render of the registering route so downstream state updates
   * (editor draft, current dashboard, etc.) propagate to the aside.
   */
  notifyContentChanged: () => void;
}

export function useAsideSlot(): AsideSlotHandle {
  const store = useContext(AsideSlotContext);

  if (!store) throw new Error("useAsideSlot must be used inside <AsideSlotProvider>.");

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // The handle memoises on `snapshot.isOpen` only — content changes
  // flow through the `content` getter instead, which reads the store
  // fresh on every access. That keeps the handle referentially
  // stable across `notifyContentChanged` calls so downstream
  // `useCallback([asideSlot])` / `useEffect([asideSlot])` deps don't
  // churn every time a subscriber wakes the store up.
  //
  // The `snapshot` variable in the hook body still updates on every
  // notify (it's a fresh binding per render), but we don't want to
  // include it in the memo deps — that would force this useMemo to
  // re-run on every content revision and put us back where we
  // started. The getter uses `store.getSnapshot()` directly so it
  // never reads a stale captured `snapshot`.
  return useMemo<AsideSlotHandle>(
    () => ({
      isOpen: snapshot.isOpen,
      get content() {
        const current = store.getSnapshot();

        return current.renderer ? current.renderer() : null;
      },
      setOpen: store.setOpen,
      toggle: store.toggle,
      setRenderer: store.setRenderer,
      notifyContentChanged: store.notifyContentChanged,
    }),
    [snapshot.isOpen, store],
  );
}

/**
 * The idiomatic way for a route to register + tear down its aside
 * content. The hook keeps the current render callback in a ref so
 * the store never sees a new renderer reference from a re-render;
 * it just calls the ref's current value on demand.
 *
 * Pass any dependencies that should trigger a re-render of the
 * aside panel through the `render` callback's closure — because the
 * renderer runs during AppShell's render pass, closures see up-to-
 * date values.
 *
 * @param enabled Whether the aside should be registered at all.
 *                Toggling this to `false` unregisters (equivalent to
 *                unmounting the route).
 * @param render  A pure render function returning the aside content.
 *                Called from AppShell's render — safe to use hooks
 *                from HeroUI/HTML, but avoid creating derived state
 *                inside; move that into the route.
 */
export function useRegisterAsideContent(
  enabled: boolean,
  render: AsideRenderer,
  /**
   * Explicit dependency array — same shape as `useEffect`'s deps.
   * The store is nudged (`notifyContentChanged`) whenever one of
   * these changes, so `AppShell` re-reads the content getter with
   * the render callback's latest closure state (editor draft,
   * resolved current dashboard, etc.).
   *
   * Must be explicit, not implicit: any subscriber to the store
   * (AppShell) re-renders on notify → the re-render cascades to
   * this route (its descendant) → without deps the effect would
   * fire again → infinite loop. The deps break the cycle by
   * stabilising after one pass — a second render triggered by the
   * cascade sees the same deps references and skips the notify.
   */
  deps: ReadonlyArray<unknown> = [],
): void {
  const { setRenderer, notifyContentChanged } = useAsideSlot();
  const renderRef = useRef<AsideRenderer>(render);

  // Keep the ref in sync every render so the stable wrapper below
  // always calls the latest callback closure.
  renderRef.current = render;

  useEffect(() => {
    if (!enabled) {
      setRenderer(null);

      return;
    }

    const wrapper: AsideRenderer = () => renderRef.current();

    setRenderer(wrapper);

    return () => {
      setRenderer(null);
    };
  }, [enabled, setRenderer]);

  // Only nudge the store when the caller's declared deps flip.
  // React's exhaustive-deps rule can't statically infer this list
  // (deps is a runtime array), so we disable the lint at the callsite.
  //
  // The empty-default behaviour is intentional: a caller who omits
  // deps only signals "content changed" at mount, which matches the
  // original static-content semantics. Interactive panels MUST pass
  // deps so downstream state changes propagate.
  //
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (enabled) notifyContentChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, notifyContentChanged, ...deps]);
}
