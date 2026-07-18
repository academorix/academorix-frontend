/**
 * @file sdui-runtime.provider.tsx
 * @module @stackra/sdui/react/providers
 * @description `<SduiRuntimeProvider>` — owns the SDUI runtime state for
 *   a single rendered screen: local `$.state`, open overlays, form-value
 *   registry, notification sink.
 *
 *   The provider maintains `$.state` as a TanStack `Store<Record<string,
 *   unknown>>` created via {@link createReactiveStore}, so:
 *
 *   1. Schema-authored `setState` / `toggleState` actions flow through
 *      the framework `SetStateHandler` — the adapter substitutes
 *      `SDUI_RUNTIME_STORE` as the default `storeToken`, and the
 *      registered store is what the handler mutates. No SDUI branch in
 *      the handler; the framework treats the SDUI runtime like any
 *      other registered store.
 *
 *   2. Direct callers (`useSduiRuntime().setState(...)`) mutate the
 *      same store — no divergent write path.
 *
 *   3. The store is optionally registered in `StateRegistry` under
 *      `SDUI_RUNTIME_STORE` when `@stackra/state` is wired. Without
 *      that peer, the provider still works — schema-level `setState`
 *      simply fails softly (no handler / no registry) but the local
 *      `useSduiRuntime().setState(...)` path still functions.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useOptionalInject } from '@stackra/container/react';
import type { Store } from '@tanstack/store';
import { useStore as useTanStackStore } from '@tanstack/react-store';
import { createReactiveStore } from '@stackra/state';
import type { StateRegistry } from '@stackra/state';
import type {
  IEventEmitter,
  IOverlayRegistry,
  ISduiEvalScope,
  ISduiNotification,
  ISduiRuntime,
} from '@stackra/contracts';
import {
  EVENT_EMITTER,
  OVERLAY_REGISTRY,
  SDUI_RUNTIME_STORE,
  STATE_REGISTRY,
} from '@stackra/contracts';

import { getAtPath, setAtPath } from '@/core/utils/dotted-path.util';

/**
 * Props for {@link SduiRuntimeProvider}. The runtime interface itself
 * (`ISduiRuntime`, `ISduiNotification`) is contract-owned — consumers
 * import those from `@stackra/contracts`, not this provider file.
 */
export interface ISduiRuntimeProviderProps {
  /** `$.data` — top-level fetched data merged into the evaluator scope. */
  readonly data?: Readonly<Record<string, unknown>>;

  /** `$.user` — session user merged into the evaluator scope. */
  readonly user?: Readonly<Record<string, unknown>>;

  /**
   * Optional notification sink. When present, `runtime.notify(...)`
   * forwards to it (typically to a HeroUI toast). When absent, the
   * provider logs the notification to the console — a dev-time
   * fallback so notifications aren't silently dropped.
   */
  readonly onNotify?: (notification: ISduiNotification) => void;

  readonly children: ReactNode;
}

const SduiRuntimeContext = createContext<ISduiRuntime | null>(null);

/**
 * `<SduiRuntimeProvider>` — provides the SDUI runtime to its subtree.
 *
 * @example
 * ```tsx
 * import { SduiRuntimeProvider } from '@stackra/sdui/react';
 *
 * <SduiRuntimeProvider data={screen.data} user={user} onNotify={toast}>
 *   <SduiTree root={screen.root} registry={componentRegistry} />
 * </SduiRuntimeProvider>
 * ```
 */
export function SduiRuntimeProvider({
  data = {},
  user = {},
  onNotify,
  children,
}: ISduiRuntimeProviderProps) {
  // Optional cross-package DI resolutions. Each may be `undefined`
  // when the consumer hasn't installed the corresponding piece — the
  // provider still works in "local-only" mode.
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);
  const stateRegistry = useOptionalInject<StateRegistry>(STATE_REGISTRY);
  const overlayRegistry = useOptionalInject<IOverlayRegistry>(OVERLAY_REGISTRY);

  // The `$.state` store — created once per provider mount via lazy
  // useState so React never rebuilds the store mid-lifetime. The store
  // itself auto-emits `sdui.changed` on every mutation via
  // `createReactiveStore`; no manual `emit()` calls needed.
  const [store] = useState<Store<Record<string, unknown>>>(() =>
    createReactiveStore('sdui', {}, events)
  );

  // Subscribe to store changes so React re-renders `scope.state` when a
  // mutation lands (either via `runtime.setState` OR via the framework
  // `SetStateHandler` writing through `StateRegistry`).
  const state = useTanStackStore(store, (s) => s);

  // Register the runtime store in the app-wide `StateRegistry` — this
  // is what makes `{kind:'setState', storeToken: SDUI_RUNTIME_STORE, ...}`
  // dispatches find and mutate our store. Skipped when @stackra/state
  // isn't wired (local-only mode).
  useEffect(() => {
    if (!stateRegistry) return;
    stateRegistry.registerStore('sdui', SDUI_RUNTIME_STORE, store as Store<unknown>, {});
    return () => {
      // Registry entries key on `name`; `remove()` is a no-op when
      // absent, so double-cleanup under StrictMode is safe.
      stateRegistry.remove('sdui');
    };
  }, [stateRegistry, store]);

  // Overlay stack. When the framework `OverlayRegistry` is wired, the
  // provider mirrors its state (single source of truth: the framework
  // registry). When absent, local state is standalone — the adapter's
  // fallback path mutates it directly.
  const [overlays, setOverlays] = useState<readonly string[]>([]);

  // Subscribe to framework OverlayRegistry when present, so
  // `runtime.isOverlayOpen(...)` and every schema binding that reads
  // the local overlay set stays in sync with the app-wide registry.
  useEffect(() => {
    if (!overlayRegistry) return;
    // Seed the initial snapshot on subscribe so the local view starts
    // aligned with any overlays already open when the provider mounts.
    const unsubscribe = overlayRegistry.subscribe((open) => {
      setOverlays(Array.from(open));
    });
    return unsubscribe;
  }, [overlayRegistry]);

  // Form registry — form values keyed by `(formId, field)`. Held in a
  // ref because form values are read imperatively by the `submitForm`
  // action; storing them in state would re-render every keystroke.
  const formsRef = useRef<Map<string, Map<string, unknown>>>(new Map());

  const scope = useMemo<ISduiEvalScope>(() => ({ data, state, user }), [data, state, user]);

  const setState = useCallback(
    (path: string, value: unknown) => {
      // Delegate to the same store the framework `SetStateHandler`
      // writes to — one code path per mutation, no divergence.
      store.setState((prev) => setAtPath(prev, path, value));
    },
    [store]
  );

  const toggleState = useCallback(
    (path: string) => {
      store.setState((prev) => setAtPath(prev, path, !Boolean(getAtPath(prev, path))));
    },
    [store]
  );

  const isOverlayOpen = useCallback(
    (overlayId: string) => overlays.includes(overlayId),
    [overlays]
  );

  const openOverlay = useCallback(
    (overlayId: string) => {
      // Prefer the framework registry when present — the subscription
      // above will echo the change back into local state, keeping one
      // source of truth. Fall back to direct local mutation only when
      // the framework overlay handlers aren't wired.
      if (overlayRegistry) {
        overlayRegistry.open(overlayId);
        return;
      }
      setOverlays((prev) => (prev.includes(overlayId) ? prev : [...prev, overlayId]));
    },
    [overlayRegistry]
  );

  const closeOverlay = useCallback(
    (overlayId?: string) => {
      if (overlayRegistry) {
        if (overlayId === undefined) {
          overlayRegistry.closeTop();
        } else {
          overlayRegistry.close(overlayId);
        }
        return;
      }
      setOverlays((prev) => {
        if (!overlayId) return prev.slice(0, -1);
        return prev.filter((id) => id !== overlayId);
      });
    },
    [overlayRegistry]
  );

  const setFormField = useCallback((formId: string, field: string, value: unknown) => {
    let form = formsRef.current.get(formId);
    if (!form) {
      form = new Map();
      formsRef.current.set(formId, form);
    }
    form.set(field, value);
  }, []);

  const getFormValues = useCallback((formId: string): Record<string, unknown> => {
    const form = formsRef.current.get(formId);
    if (!form) return {};
    return Object.fromEntries(form.entries());
  }, []);

  const notify = useCallback(
    (notification: ISduiNotification) => {
      if (onNotify) {
        onNotify(notification);
      } else {
        // Dev-time fallback — a schema author fired a `toast` action but
        // the app hasn't wired a real toast sink. Log so the message
        // isn't silently lost, but don't throw (the schema is doing
        // exactly what it should).
        // eslint-disable-next-line no-console
        console.info('[sdui] notify', notification);
      }
    },
    [onNotify]
  );

  const value = useMemo<ISduiRuntime>(
    () => ({
      scope,
      setState,
      toggleState,
      isOverlayOpen,
      openOverlay,
      closeOverlay,
      setFormField,
      getFormValues,
      notify,
    }),
    [
      scope,
      setState,
      toggleState,
      isOverlayOpen,
      openOverlay,
      closeOverlay,
      setFormField,
      getFormValues,
      notify,
    ]
  );

  return <SduiRuntimeContext.Provider value={value}>{children}</SduiRuntimeContext.Provider>;
}

/**
 * Consume the current SDUI runtime.
 *
 * @throws When called outside a `<SduiRuntimeProvider>`.
 *
 * @example
 * ```tsx
 * import { useSduiRuntime } from '@stackra/sdui/react';
 *
 * function ChildOfSduiScreen() {
 *   const runtime = useSduiRuntime();
 *   return <div>State: {JSON.stringify(runtime.scope.state)}</div>;
 * }
 * ```
 */
export function useSduiRuntime(): ISduiRuntime {
  const runtime = useContext(SduiRuntimeContext);
  if (!runtime) {
    throw new Error('useSduiRuntime() must be called inside a <SduiRuntimeProvider>.');
  }
  return runtime;
}
