/**
 * @file resolver.ts
 * @module modules/settings/scope/resolver
 *
 * @description
 * Pure functions for resolving a setting's effective value across the scope
 * hierarchy. Separated from the React provider so it can be unit-tested and
 * reused in server-rendered / non-React consumers.
 */

import type {
  ScopeContext,
  ScopeKind,
  SettingField,
  SettingResolution,
  SettingValueRow,
} from "./types";

import { SCOPE_HIERARCHY } from "./types";

/**
 * Return the scope-id for a `ScopeKind` given the active context. `system`
 * has no id; `user`/`branch`/etc. read from the context.
 */
function scopeIdFor(scope: ScopeKind, context: ScopeContext): string | null {
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
}

/**
 * Return the raw value stored at `scope` for a given field, or `undefined`
 * when no value has been persisted at that scope.
 */
export function readRawValue(
  field: SettingField,
  scope: ScopeKind,
  context: ScopeContext,
  rows: SettingValueRow[],
): unknown {
  if (scope === "system") return field.defaultValue;
  const scopeId = scopeIdFor(scope, context);

  if (scopeId == null) return undefined;

  // Translatable values live under the current locale key. Non-translatable
  // fields ignore the locale and use `null`.
  const wantedLocale = field.translatable ? context.locale : null;
  const row = rows.find(
    (r) =>
      r.key === field.key &&
      r.scopeKind === scope &&
      r.scopeId === scopeId &&
      r.locale === wantedLocale,
  );

  if (!row) {
    // Fall back to the default locale for translatable settings.
    if (field.translatable && wantedLocale !== "en") {
      const fallback = rows.find(
        (r) =>
          r.key === field.key &&
          r.scopeKind === scope &&
          r.scopeId === scopeId &&
          r.locale === "en",
      );

      return fallback?.value;
    }

    return undefined;
  }

  return row.value;
}

/**
 * Compute the effective value for `field` by walking the scope hierarchy
 * from most-specific to most-general and picking the first defined row.
 */
export function resolveSetting(
  field: SettingField,
  context: ScopeContext,
  rows: SettingValueRow[],
): SettingResolution {
  const perScope: Partial<Record<ScopeKind, unknown>> = {};

  for (const scope of SCOPE_HIERARCHY) {
    perScope[scope] = readRawValue(field, scope, context, rows);
  }

  // Walk most-specific → most-general. The `system` fallback is always defined.
  let effective: unknown = perScope.system;
  let effectiveScope: ScopeKind = "system";

  for (const scope of [...SCOPE_HIERARCHY].reverse()) {
    if (scope === "system") continue;
    const value = perScope[scope];

    if (value !== undefined) {
      effective = value;
      effectiveScope = scope;
      break;
    }
  }

  // If nothing overrode the default, the `system` scope is the source.
  if (effectiveScope === "system") {
    effective = perScope.system ?? field.defaultValue;
  }

  return {
    key: field.key,
    field,
    effective,
    effectiveScope,
    perScope,
    isOverriddenAtEditingScope: false, // Filled in by the provider based on editing scope.
  };
}

/**
 * Utility: does the record `rows` contain any override at `editingScope` for
 * `field.key`? Used to render the linked / unlinked icon.
 */
export function hasOverrideAt(
  field: SettingField,
  editingScope: ScopeKind,
  context: ScopeContext,
  rows: SettingValueRow[],
): boolean {
  const value = readRawValue(field, editingScope, context, rows);

  return value !== undefined && (editingScope !== "system" || value !== field.defaultValue);
}
