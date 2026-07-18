/**
 * @file settings-provider.tsx
 * @module modules/settings/scope/settings-provider
 *
 * @description
 * The React glue that owns the current scope context, hydrates settings
 * from Refine's data provider (schema and values are two resources —
 * `settings-schema` and `settings-values` — currently backed by JSON
 * fixtures under `src/refine/data/`), merges in module-contributed fields
 * from `appSettings`, and exposes hooks for reading resolved values +
 * writing per-scope overrides.
 *
 * Consumers use:
 *  - `<SettingsProvider>` at the root of `/settings/*`.
 *  - `useSettingsScope()` to read + change the current editing scope + list all fields.
 *  - `useSetting(field)` to get a resolved value + a `setValue` callback.
 */

import { useCreate, useDelete, useList, useUpdate } from "@refinedev/core";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { ReactNode } from "react";
import type { BaseKey, BaseRecord } from "@refinedev/core";
import type {
  ScopeContext,
  ScopeKind,
  SettingField,
  SettingResolution,
  SettingValueRow,
} from "./types";

import { useLocale } from "@/hooks/use-locale";
import { appSettings } from "@/modules/registry";

import { hasOverrideAt, resolveSetting } from "./resolver";

// -----------------------------------------------------------------------------
// Context shape
// -----------------------------------------------------------------------------

type SettingsContextValue = {
  /** All field declarations available — JSON fixture + module contributions. */
  fields: SettingField[];
  /** Filter helper — every field in a given section. */
  fieldsForSection: (sectionId: string) => SettingField[];
  /** Every persisted override, across every scope. */
  rows: SettingValueRow[];
  /** Loading indicator for the initial fetch. */
  isLoading: boolean;
  /** The scope-id tuple used when reading + writing. */
  context: ScopeContext;
  /** Which scope the settings UI is currently *editing at*. */
  editingScope: ScopeKind;
  setEditingScope: (scope: ScopeKind) => void;
  /** Persist a value at `editingScope` for the given field key. */
  setValue: (key: string, value: unknown, locale?: string | null) => void;
  /** Remove the override at `editingScope` (falls back to the parent). */
  clearOverride: (key: string, locale?: string | null) => void;
  /** Resolve a field given the current context. */
  resolve: (field: SettingField) => SettingResolution;
  /** Report whether the current editing scope has a local value. */
  hasLocalOverride: (field: SettingField) => boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

// -----------------------------------------------------------------------------
// Scope context defaults (mocked until real auth wires in)
// -----------------------------------------------------------------------------

const DEFAULT_CONTEXT: Omit<ScopeContext, "locale"> = {
  tenantId: "tenant-academorix",
  regionId: "region-mena",
  organizationId: "org-academorix-athletics",
  branchId: "branch-riyadh-central",
  userId: "user-current",
};

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [editingScope, setEditingScope] = useState<ScopeKind>("tenant");

  // Fetch schema + values via Refine. Both resources are registered in the
  // data provider under `settings-schema` / `settings-values`; the JSON
  // fixtures at `src/refine/data/` act as the mock API response.
  const { result: schemaResult, query: schemaQuery } = useList<SettingField & BaseRecord>({
    resource: "settings-schema",
    pagination: { mode: "off" },
  });
  const { result: valuesResult, query: valuesQuery } = useList<SettingValueRow & BaseRecord>({
    resource: "settings-values",
    pagination: { mode: "off" },
  });

  const { mutate: createValue } = useCreate<SettingValueRow>();
  const { mutate: updateValue } = useUpdate<SettingValueRow>();
  const { mutate: deleteValue } = useDelete();

  // Merge JSON-supplied fields with runtime module contributions. Module
  // fields take precedence on a key collision — a module can override the
  // fixture's declaration if it needs to tweak constraints for its own key.
  const fields: SettingField[] = useMemo(() => {
    const map = new Map<string, SettingField>();

    for (const field of (schemaResult?.data ?? []) as SettingField[]) map.set(field.key, field);
    for (const field of appSettings) map.set(field.key, field);

    return Array.from(map.values());
  }, [schemaResult?.data]);

  const rows = useMemo(() => (valuesResult?.data ?? []) as SettingValueRow[], [valuesResult?.data]);

  const context: ScopeContext = useMemo(() => ({ ...DEFAULT_CONTEXT, locale }), [locale]);

  const scopeIdFor = useCallback(
    (scope: ScopeKind): string | null => {
      switch (scope) {
        case "system":
          return null;
        case "tenant":
          return context.tenantId;
        case "region":
          return context.regionId;
        case "organization":
          return context.organizationId;
        case "branch":
          return context.branchId;
        case "user":
          return context.userId;
      }
    },
    [context],
  );

  const fieldsForSection = useCallback(
    (sectionId: string): SettingField[] => fields.filter((f) => f.section === sectionId),
    [fields],
  );

  const findRowId = useCallback(
    (
      key: string,
      scope: ScopeKind,
      scopeId: string | null,
      rowLocale: string | null,
    ): BaseKey | undefined => {
      const match = rows.find(
        (r) =>
          r.key === key && r.scopeKind === scope && r.scopeId === scopeId && r.locale === rowLocale,
      );

      return match ? ((match as unknown as BaseRecord).id as BaseKey | undefined) : undefined;
    },
    [rows],
  );

  const setValue = useCallback(
    (key: string, value: unknown, localeArg?: string | null) => {
      const scopeId = scopeIdFor(editingScope);
      // Non-translatable rows always store `locale: null`; translatable rows
      // key on the active locale (or the caller-supplied override).
      const field = fields.find((f) => f.key === key);
      const rowLocale = localeArg === undefined ? (field?.translatable ? locale : null) : localeArg;
      const existingId = findRowId(key, editingScope, scopeId, rowLocale);

      const payload = {
        key,
        scopeKind: editingScope,
        scopeId,
        locale: rowLocale,
        value,
        updatedAt: new Date().toISOString(),
        updatedBy: context.userId ?? undefined,
      };

      if (existingId !== undefined) {
        updateValue({ resource: "settings-values", id: existingId, values: payload });
      } else {
        createValue({
          resource: "settings-values",
          values: {
            ...payload,
            id: `setting-${key}-${editingScope}-${scopeId ?? "root"}-${rowLocale ?? "none"}-${Date.now()}`,
          },
        });
      }
    },
    [editingScope, scopeIdFor, locale, context.userId, fields, findRowId, createValue, updateValue],
  );

  const clearOverride = useCallback(
    (key: string, localeArg?: string | null) => {
      const scopeId = scopeIdFor(editingScope);
      const field = fields.find((f) => f.key === key);
      const rowLocale = localeArg === undefined ? (field?.translatable ? locale : null) : localeArg;
      const id = findRowId(key, editingScope, scopeId, rowLocale);

      if (id !== undefined) deleteValue({ resource: "settings-values", id });
    },
    [editingScope, scopeIdFor, locale, fields, findRowId, deleteValue],
  );

  const resolve = useCallback(
    (field: SettingField): SettingResolution => {
      const base = resolveSetting(field, context, rows);
      const isOverriddenAtEditingScope = hasOverrideAt(field, editingScope, context, rows);

      return { ...base, isOverriddenAtEditingScope };
    },
    [context, editingScope, rows],
  );

  const hasLocalOverride = useCallback(
    (field: SettingField): boolean => hasOverrideAt(field, editingScope, context, rows),
    [context, editingScope, rows],
  );

  const value: SettingsContextValue = useMemo(
    () => ({
      fields,
      fieldsForSection,
      rows,
      isLoading: schemaQuery.isLoading || valuesQuery.isLoading,
      context,
      editingScope,
      setEditingScope,
      setValue,
      clearOverride,
      resolve,
      hasLocalOverride,
    }),
    [
      fields,
      fieldsForSection,
      rows,
      schemaQuery.isLoading,
      valuesQuery.isLoading,
      context,
      editingScope,
      setValue,
      clearOverride,
      resolve,
      hasLocalOverride,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

export function useSettingsScope(): SettingsContextValue {
  const ctx = useContext(SettingsContext);

  if (!ctx) throw new Error("useSettingsScope must be used inside <SettingsProvider>.");

  return ctx;
}

/** Read a setting's resolved value + a setter. */
export function useSetting(field: SettingField): {
  value: unknown;
  effectiveScope: ScopeKind;
  isOverridden: boolean;
  perScope: SettingResolution["perScope"];
  setValue: (next: unknown) => void;
  clearOverride: () => void;
  resolution: SettingResolution;
} {
  const scope = useSettingsScope();
  const resolution = scope.resolve(field);

  const setter = useCallback(
    (next: unknown) => scope.setValue(field.key, next),
    [scope, field.key],
  );
  const clearer = useCallback(() => scope.clearOverride(field.key), [scope, field.key]);

  return {
    value: resolution.effective,
    effectiveScope: resolution.effectiveScope,
    isOverridden: resolution.isOverriddenAtEditingScope,
    perScope: resolution.perScope,
    setValue: setter,
    clearOverride: clearer,
    resolution,
  };
}
