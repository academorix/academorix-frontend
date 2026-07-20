/**
 * @file use-settings.hook.ts
 * @module @stackra/settings/core/hooks
 * @description Reactive settings hook.
 *
 *   Returns the current values for a settings group + a stable
 *   setter surface. Backed by React's `useSyncExternalStore` so
 *   subscription cleanup is automatic and concurrent-mode safe.
 *
 *   Lives in `core/hooks` (rather than `react/hooks`) because it uses
 *   only cross-platform React APIs — the native subpath re-exports
 *   it verbatim when needed.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";
import { SETTINGS_SERVICE, type ISettingsService, type Type } from "@stackra/contracts";

import type { IUseSettingsResult } from "./use-settings.interface";

/**
 * Subscribe a component to a settings group.
 *
 * Accepts a DTO constructor (`useSettings(DisplaySettings)`) OR a
 * group key string (`useSettings('display')`). The DTO form gives
 * fully-typed `values` / `set` / `setMany`; the string form
 * degrades to `Record<string, unknown>`.
 *
 * @example DTO form
 * ```tsx
 * const { values, set } = useSettings(DisplaySettings);
 * <Switch isSelected={values.compact} onChange={(v) => set('compact', v)} />
 * ```
 *
 * @example Key form
 * ```tsx
 * const { values, setMany } = useSettings<{ compact: boolean }>('display');
 * ```
 */
export function useSettings<T extends object>(dto: Type<T>): IUseSettingsResult<T>;
export function useSettings<T extends Record<string, unknown> = Record<string, unknown>>(
  groupKey: string,
): IUseSettingsResult<T>;
export function useSettings<T extends object>(dtoOrKey: Type<T> | string): IUseSettingsResult<T> {
  const service = useInject<ISettingsService>(SETTINGS_SERVICE);

  // Resolve the group key up-front so we can pass it to
  // `useSyncExternalStore` as a subscribe key + reuse it in the
  // getter / setters.
  const groupKey = typeof dtoOrKey === "string" ? dtoOrKey : resolveKey(service, dtoOrKey);

  // useSyncExternalStore needs stable references for `subscribe` and
  // `getSnapshot`. We also cache the last snapshot ourselves so the
  // returned reference is stable across re-renders unless a
  // subscriber actually fired — React 18+ uses referential equality
  // to bail out.
  const subscribe = useCallback(
    (onStoreChange: () => void) => service.subscribe(groupKey, onStoreChange),
    [service, groupKey],
  );

  const getSnapshot = useCallback(() => {
    // Prefer the DTO-typed getter when we have it; falls back to the
    // key path for schema-only groups.
    if (typeof dtoOrKey === "string") {
      return (service.getByKey(dtoOrKey) ?? emptyRecord) as T;
    }
    return service.get(dtoOrKey);
  }, [service, dtoOrKey]);

  const values = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const set = useCallback(
    (key: keyof T & string, value: unknown): void => {
      if (typeof dtoOrKey === "string") {
        service.setByKey(dtoOrKey, key, value);
      } else {
        service.set(dtoOrKey, key, value);
      }
    },
    [service, dtoOrKey],
  );

  const setMany = useCallback(
    (partial: Partial<T>): void => {
      if (typeof dtoOrKey === "string") {
        service.setManyByKey(dtoOrKey, partial as Record<string, unknown>);
      } else {
        service.setMany(dtoOrKey, partial);
      }
    },
    [service, dtoOrKey],
  );

  const reset = useCallback((): void => {
    if (typeof dtoOrKey === "string") {
      service.resetByKey(dtoOrKey);
    } else {
      service.reset(dtoOrKey);
    }
  }, [service, dtoOrKey]);

  return { values, set, setMany, reset };
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Stable empty record used by the key-form snapshot when unknown. */
const emptyRecord: Record<string, unknown> = Object.freeze({});

/** Resolve the group key for a DTO — surfaces the error early. */
function resolveKey(service: ISettingsService, dto: Type): string {
  const definition = service.getGroups().find((d) => d.dto === dto);
  if (!definition) {
    throw new Error(
      `[useSettings] "${dto.name}" is not registered. ` +
        `Wrap it with SettingsModule.forFeature([${dto.name}]).`,
    );
  }
  return definition.key;
}
