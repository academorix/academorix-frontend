/**
 * @file types.ts
 * @module modules/settings/scope/types
 *
 * @description
 * The scope model for the Settings subsystem. Every setting is resolved
 * against a 6-level scope chain (System → Tenant → Region → Organization →
 * Branch → User) with an orthogonal Locale axis for translatable values.
 */

// -----------------------------------------------------------------------------
// Scope hierarchy
// -----------------------------------------------------------------------------

export type ScopeKind =
  | "system" // bundled defaults, deepest fallback
  | "tenant" // per-workspace
  | "region" // geographic
  | "organization" // legal entity
  | "branch" // physical location
  | "user"; // per-user preference

/** The scope levels ordered from most-general to most-specific. */
export const SCOPE_HIERARCHY: readonly ScopeKind[] = [
  "system",
  "tenant",
  "region",
  "organization",
  "branch",
  "user",
] as const;

/** Human-readable label for a scope kind. */
export const SCOPE_LABEL: Record<ScopeKind, string> = {
  system: "System default",
  tenant: "Tenant",
  region: "Region",
  organization: "Organization",
  branch: "Branch",
  user: "User",
};

/** Iconify token per scope, used in the UI. */
export const SCOPE_ICON: Record<ScopeKind, string> = {
  system: "cube",
  tenant: "office-building",
  region: "geo",
  organization: "briefcase",
  branch: "location",
  user: "person",
};

// -----------------------------------------------------------------------------
// Setting field schema
// -----------------------------------------------------------------------------

/** Every possible setting value shape. */
export type SettingType =
  | "string"
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "boolean"
  | "select"
  | "multiselect"
  | "date"
  | "time"
  | "color"
  | "json"
  | "file"
  | "duration"; // stored as number of minutes

/** Options for `select` / `multiselect` fields. */
export type SettingOption = { id: string; label: string; icon?: string };

/** A single declarative setting entry. */
export type SettingField = {
  /** Fully-qualified key, e.g. `"workspace.general.timezone"`. */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Optional description shown under the label + inside the info tooltip. */
  description?: string;
  /** Setting value kind. */
  type: SettingType;
  /** Bundled default (rendered as the `System default` in the cascade). */
  defaultValue: unknown;
  /**
   * The deepest scope that may override this setting. Fields with
   * `lowestOverride: "tenant"` are workspace-wide only and never per-branch.
   */
  lowestOverride: ScopeKind;
  /**
   * `true` when the value varies per user locale — e.g. terminology
   * overrides, email templates, announcement strings. Stored as
   * `{en: "...", ar: "...", ...}`.
   */
  translatable?: boolean;
  /** Permission required to see and edit this setting. */
  requiredPermission?: string;
  /** Section id this setting belongs to (mirrors `settings.sections`). */
  section: string;
  /** Optional group inside the section — renders as a header. */
  group?: string;

  // Type-specific constraints
  options?: SettingOption[]; // select / multiselect
  /**
   * Force the field to render as a searchable ComboBox even when the
   * option list is short. When omitted, the field auto-upgrades to a
   * ComboBox once `options.length > 10` — the threshold above which
   * a flat dropdown becomes a chore to scan.
   */
  searchable?: boolean;
  min?: number; // number / currency / percent / duration
  max?: number;
  step?: number;
  unit?: string; // display suffix for numeric fields
  currency?: string; // ISO code for currency fields — defaults to workspace currency
  rows?: number; // textarea rows
  placeholder?: string;
  isSecret?: boolean; // API keys, webhook secrets — masked in the UI
  /** Optional per-scope validator; returns an error string when invalid. */
  validate?: (value: unknown) => string | null;
};

// -----------------------------------------------------------------------------
// Scope context (the "who is looking?" tuple)
// -----------------------------------------------------------------------------

export type ScopeContext = {
  tenantId: string | null;
  regionId: string | null;
  organizationId: string | null;
  branchId: string | null;
  userId: string | null;
  /** Active locale for translatable settings — e.g. `"en"`, `"ar"`. */
  locale: string;
};

// -----------------------------------------------------------------------------
// Value storage shape
// -----------------------------------------------------------------------------

/** One row in the `settings_values` table. */
export type SettingValueRow = {
  key: string;
  scopeKind: ScopeKind;
  scopeId: string | null;
  /** `null` for non-translatable values. */
  locale: string | null;
  value: unknown;
  updatedAt: string;
  updatedBy?: string;
};

/** The resolved-value bundle returned by the resolver — one entry per scope. */
export type SettingResolution = {
  key: string;
  field: SettingField;
  /** The effective value after cascading. */
  effective: unknown;
  /** Which scope contributed the effective value. */
  effectiveScope: ScopeKind;
  /** Per-scope raw values (missing scopes are `undefined`). */
  perScope: Partial<Record<ScopeKind, unknown>>;
  /** `true` when the current editing scope has a local override. */
  isOverriddenAtEditingScope: boolean;
};
