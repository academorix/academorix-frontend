/**
 * @file settings-provider.provider.tsx
 * @module @stackra/settings/react/providers/settings-provider
 * @description Optional React provider for the settings package.
 *
 *   The settings service, registry, and manager are already available
 *   through DI without any provider — `useSettings(dto)` works
 *   anywhere inside `<ContainerProvider>`. This provider adds two
 *   affordances on top:
 *
 *   - **SSR / streaming hydration** — accepts `initialSchema` and
 *     `initialValues` props and applies them on mount so the first
 *     client render observes the same schema + values the server
 *     rendered against.
 *   - **Boot-readiness gate** — when `ready="waitSchema"`, defers
 *     children until the remote schema fetch has settled, rendering
 *     an optional `fallback` in the meantime.
 */

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useInject, useOptionalInject } from "@stackra/container/react";
import {
  EVENT_EMITTER,
  SETTINGS_EVENTS,
  SETTINGS_REGISTRY,
  SETTINGS_SERVICE,
  type IEventEmitter,
  type ISettingsRegistry,
  type ISettingsService,
} from "@stackra/contracts";

import { SettingsContext } from "@/react/contexts/settings";
import type { ISettingsContextValue } from "@/react/contexts/settings";
import type { ISettingsProviderProps } from "./settings-provider.interface";

/**
 * Provider that hydrates SSR settings state + optionally defers
 * render until the remote schema has loaded.
 *
 * Placement: near the top of the tree, inside `<ContainerProvider>`
 * so `useInject` can resolve `SETTINGS_REGISTRY` / `SETTINGS_SERVICE`.
 *
 * @example Immediate mode (default)
 * ```tsx
 * <ContainerProvider container={container}>
 *   <SettingsProvider>
 *     <App />
 *   </SettingsProvider>
 * </ContainerProvider>
 * ```
 *
 * @example SSR hydration + wait-for-schema gate
 * ```tsx
 * <SettingsProvider
 *   initialSchema={schemaFromSSR}
 *   initialValues={valuesFromSSR}
 *   ready="waitSchema"
 *   fallback={<SettingsSkeleton />}
 * >
 *   <SettingsPanel />
 * </SettingsProvider>
 * ```
 */
export function SettingsProvider(props: ISettingsProviderProps): JSX.Element {
  const { children, initialSchema, initialValues, ready = "immediate", fallback = null } = props;

  const registry = useInject<ISettingsRegistry>(SETTINGS_REGISTRY);
  const service = useInject<ISettingsService>(SETTINGS_SERVICE);
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);

  // Immediate mode → we're always ready. Wait-for-schema mode starts
  // pending and flips once the schema event fires or hydration
  // applies. Track a ref alongside so the flip is idempotent — flipping
  // state twice would trigger a redundant render.
  const [isReady, setIsReady] = useState(ready === "immediate");
  const hasFlippedRef = useRef(ready === "immediate");

  // Apply hydration exactly once on mount. Registration failures on
  // individual groups are logged by the registry itself; we still flip
  // ready so the app doesn't hang on a partial payload.
  const hydrationAppliedRef = useRef(false);
  useEffect(() => {
    if (hydrationAppliedRef.current) return;
    hydrationAppliedRef.current = true;

    if (initialSchema && initialSchema.length > 0) {
      registry.registerManyFromSchema(initialSchema);
    }
    if (initialValues) {
      service.hydrateAll(initialValues);
    }

    // If the caller hydrated a schema, honour their intent — the
    // registry is warm even without a network fetch, so flip ready.
    if (ready === "waitSchema" && initialSchema && initialSchema.length > 0) {
      if (!hasFlippedRef.current) {
        hasFlippedRef.current = true;
        setIsReady(true);
      }
    }
    // Deliberately empty deps — hydration runs once per mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for the schema-loaded event. Fires once when the schema
  // loader completes its initial fetch — after that we're ready.
  useEffect(() => {
    if (ready !== "waitSchema") return;
    if (!events) {
      // Without an event bus we can't observe the schema fetch;
      // fall back to "ready by default" so the UI doesn't stall.
      if (!hasFlippedRef.current) {
        hasFlippedRef.current = true;
        setIsReady(true);
      }
      return;
    }

    const off = events.on(SETTINGS_EVENTS.SCHEMA_LOADED, () => {
      if (hasFlippedRef.current) return;
      hasFlippedRef.current = true;
      setIsReady(true);
    });
    return () => {
      off();
    };
  }, [ready, events]);

  const contextValue = useMemo<ISettingsContextValue>(() => ({ ready: isReady }), [isReady]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {isReady ? children : fallback}
    </SettingsContext.Provider>
  );
}
