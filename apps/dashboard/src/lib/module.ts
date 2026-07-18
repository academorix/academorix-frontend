/**
 * @file module.ts
 * @module lib/module
 *
 * @description
 * The contract every feature module implements. A module co-locates its
 * screens under `src/modules/<name>/pages/` and declares — in one
 * `<name>.module.ts` manifest — the Refine **resources** and **routes** it
 * contributes to the shell.
 *
 * The {@link "@/modules/registry"} aggregates every manifest at boot via
 * `import.meta.glob`, so `App.tsx`, `router.tsx`, and the sidebar / command
 * palette never import feature code directly.
 */

import type { ResourceProps } from "@refinedev/core";
import type { ReactElement, ReactNode } from "react";

import type { ModuleSettingField } from "@/lib/settings";

// ---------------------------------------------------------------------------
// Route contract
// ---------------------------------------------------------------------------

/**
 * Which authentication tier a route belongs to.
 *
 *   * `public` — renders inside `<App>` (providers + theme) but skips
 *     the shell chrome. Login and marketing hand-offs live here.
 *   * `protected` — the default. Renders inside `<App>` and inside
 *     `<AppShell>` (sidebar + navbar + aside).
 *   * `embed` — renders **outside** `<App>` entirely. Used for
 *     anonymous public dashboards embedded in third-party contexts.
 *   * `chromeless` — renders **outside** the app shell but **inside**
 *     `<App>`. Used for authenticated full-viewport experiences that
 *     need the shell hidden (presenter mode, focus mode). The route
 *     still gets providers, theme, and auth wiring; it only skips
 *     sidebar / navbar / aside rendering. Structurally the router
 *     lifts these routes above `<App>` alongside embed so the shell
 *     never mounts around them.
 */
export type RouteTier = "public" | "protected" | "embed" | "chromeless";

/**
 * Optional host filter — reserved for a future multi-host setup (tenant
 * subdomain vs. central admin host). Undefined = registered on every host.
 */
export type HostKind = "tenant" | "central" | "central-admin";

/** A single route contributed by a module. */
export type AppRoute = {
  /**
   * Absolute path segment, e.g. `"/athletes"` or `"/athletes/:id"`.
   *
   * Optional so an entry can declare `index: true` (RRv7 index routes
   * carry no path) or a `*` fallback that lives on a parent alone.
   * The router adapter treats a missing `path` as the sentinel for an
   * index / pathless route.
   */
  path?: string;
  /** The (lazy) element to render. Build with `createElement(lazy(...))`. */
  element: ReactElement;
  /** `"public"` (login / landing) or `"protected"` (inside the shell). Defaults to `"protected"`. */
  tier?: RouteTier;
  /** For public routes only: redirect authenticated visitors here instead of rendering. */
  redirectAuthenticatedTo?: string;
  /** Optional host filter; omit to register on every host. */
  hosts?: HostKind[];
  /** Marks the route as the index (`/`) route on its parent. */
  index?: boolean;
};

// ---------------------------------------------------------------------------
// Sidebar grouping
// ---------------------------------------------------------------------------

/**
 * Canonical sidebar groups. Every resource is bucketed into one of these; the
 * shell renders `Sidebar.Group` blocks in this order.
 *
 * ## Enterprise taxonomy (July 2026)
 *
 * The original taxonomy had a single monolithic "Operations" group that
 * accumulated 27 modules — well past the 7±2 cognitive-load ceiling and
 * unusable at scale. This split rebalances the sidebar around **verb-based
 * mental models** so people can navigate by intent, not by inventing
 * where an admin decided to file something:
 *
 * - `overview`       — read-daily surfaces (Dashboard, Notifications, Reports).
 * - `people`         — "who is involved" (Athletes, Coaches, Staff, Teams,
 *                       Contacts, Reception).
 * - `programs`       — "what we teach / play" (Sports, Seasons, Training,
 *                       Drills, Formations, Competitions).
 * - `schedule`       — "when + where" (Events, Matches, Facilities,
 *                       Attendance, Private sessions).
 * - `records`        — "outcomes + history" (Registrations, Progress,
 *                       Performance, Medical, Credentials, Development,
 *                       Awards, Safeguarding).
 * - `communications` — outbound + shared docs (Announcements, Conversations,
 *                       Documents).
 * - `growth`         — funnel (Leads, Memberships, Passes, Public site).
 * - `finance`        — money (Invoices, Expenses, Subscription).
 * - `administration` — configuration surfaces, muted at the bottom
 *                       (Users, Branches, Integrations, Attributes,
 *                       Offline sync, Entitlements). Rendered collapsed
 *                       by default in the sidebar; every admin task also
 *                       reaches via `/settings/*`.
 * - `ai`             — reserved for AI-tool modules; currently empty.
 */
export type SidebarGroupKey =
  | "overview"
  | "people"
  | "programs"
  | "schedule"
  | "records"
  | "communications"
  | "growth"
  | "finance"
  | "administration"
  | "ai"
  // Legacy — kept for a soft-migration window while every module
  // manifest gets rebucketed. Modules that still declare
  // `"operations"` render under the closest new group at runtime
  // (see `resolveGroupKey` in `@/lib/groups`). Safe to remove once
  // no module manifest references it.
  | "operations";

// ---------------------------------------------------------------------------
// Shortcuts, commands, actions
// ---------------------------------------------------------------------------

/**
 * Keyboard-shortcut sequences owned by a resource. Sequences use the
 * `G X` / `N X` leader-key convention (e.g. `"G A"` for _Navigate to
 * Athletes_, `"N A"` for _Create Athlete_).
 *
 * Global chrome shortcuts (⌘K, ⌘B, ?) are owned by the shell — not here.
 */
export type AppResourceShortcuts = {
  /** Leader sequence for `Go to <label>`. */
  navigate?: string;
  /** Leader sequence for `Create <singular label>`. */
  create?: string;
  /** Optional custom verbs keyed by verb id (e.g. `{export: "E X"}`). */
  actions?: Record<string, string>;
};

/**
 * An extra command a module contributes to the ⌘K palette on top of the
 * automatic `Navigate` / `Create` entries. Commands are gated by permission
 * and can either navigate somewhere or run a side effect.
 */
export type AppResourceCommand = {
  /** Stable id used as the palette item key. */
  id: string;
  /** Display label. Falls back through the i18n translator when `labelKey` is set. */
  label: string;
  /** Optional translation key; when present, overrides `label` at render time. */
  labelKey?: string;
  /**
   * Optional secondary line rendered under the label inside the palette.
   * Kept short (one line, ~60 chars) — used to disambiguate items that
   * share a verb (e.g. two "Export" actions with different scopes).
   */
  description?: string;
  /** Iconify token (bare = Gravity UI, prefixed = external set). */
  icon?: string;
  /** Keyboard shortcut sequence to display next to the command. */
  shortcut?: string;
  /** Permission required to see / execute the command. */
  requiredPermission?: string;
  /** Extra keywords fed to the fuzzy matcher. */
  keywords?: string[];
  /** Route to navigate to when the command fires. */
  route?: string;
  /** Side effect to run instead of navigation. */
  onSelect?: (ctx: { navigate: (to: string) => void }) => void;
};

/** Verb intent → drives HeroUI variant + toast on success. */
export type ResourceActionVariant = "default" | "primary" | "danger";

/**
 * The declarative "kind" of a row / bulk action. Standard intents are
 * dispatched via Refine hooks inside `ResourceGrid` (no per-module wiring
 * needed) — only `"custom"` requires an explicit `run` callback.
 *
 * - `view` — navigate to `${list}/${id}`
 * - `edit` — navigate to `${list}/${id}/edit`
 * - `duplicate` — `useCreate` with the record's fields (minus `id`)
 * - `delete` — `useDelete` with a `HoldConfirm` guard
 * - `archive` — `useUpdate` with `{isActive: false}`
 * - `export` — client-side CSV download
 * - `custom` — invokes the action's `run` callback
 */
export type RowActionIntent = "view" | "edit" | "duplicate" | "delete" | "archive" | "custom";

export type BulkActionIntent = "edit" | "export" | "archive" | "delete" | "custom";

/** Shared shape for the `run` callback context — carries the tools a custom action needs. */
export type ResourceActionContext = {
  navigate: (to: string) => void;
  /** Fire a toast — proxies to Refine's `useNotification`. */
  notify: (payload: { message: string; description?: string; type?: "success" | "error" }) => void;
};

/**
 * A per-row action rendered inside the row's overflow menu (three-dot button).
 * Runs against a single record.
 */
export type AppResourceRowAction<T = unknown> = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: string;
  variant?: ResourceActionVariant;
  requiredPermission?: string;
  /** Declarative verb kind; defaults to `"custom"` when omitted. */
  intent?: RowActionIntent;
  /** Only used when `intent === "custom"` (or omitted). */
  run?: (record: T, ctx: ResourceActionContext) => void | string | Promise<void | string>;
  /** Optional predicate to hide the action for records that don't qualify. */
  isVisible?: (record: T) => boolean;
  /** Confirmation copy — when set, wraps the action in `ConfirmDialog` before firing. */
  confirm?: {
    title: string;
    description: string;
    confirmLabel: string;
    typeToConfirm?: string;
  };
};

/**
 * A bulk action rendered in the floating HeroUI Pro `ActionBar` when one or
 * more rows are selected. Runs against every selected record.
 */
export type AppResourceBulkAction<T = unknown> = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: string;
  variant?: ResourceActionVariant;
  requiredPermission?: string;
  /** Declarative verb kind; defaults to `"custom"` when omitted. */
  intent?: BulkActionIntent;
  /** Only used when `intent === "custom"` (or omitted). */
  run?: (records: T[], ctx: ResourceActionContext) => void | string | Promise<void | string>;
  /** Optional predicate to hide the action for the current selection. */
  isVisible?: (records: T[]) => boolean;
  /** Confirmation copy — when set, wraps the action in `ConfirmDialog` before firing. */
  confirm?: {
    title: string;
    description: string;
    confirmLabel: string;
    typeToConfirm?: string;
  };
};

// ---------------------------------------------------------------------------
// Field schema — declarative form fields for create/edit
// ---------------------------------------------------------------------------

/**
 * A single form field declaration. Consumed by `GenericFormPage` to render
 * `TextField`, `TextArea`, `NumberField`, `Select`, `Switch`, or `DatePicker`
 * with proper labels, descriptions, and validation.
 */
export type FieldSchema = {
  /** Property key on the record — dot notation is supported (e.g. `"status.text"`). */
  name: string;
  /** Human-readable label. */
  label: string;
  /** Optional translation key that overrides `label` at render time. */
  labelKey?: string;
  /** Field kind — drives the input component. */
  kind:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "richtext"
    | "number"
    | "currency"
    | "percent"
    | "select"
    | "multiselect"
    | "switch"
    | "date"
    | "file"
    | "hidden";
  /** Optional description shown under the field. */
  description?: string;
  /** Placeholder text for text-like inputs. */
  placeholder?: string;
  /** Whether the field is required. */
  isRequired?: boolean;
  /** Minimum value for `number` / `currency` / `percent`. */
  minValue?: number;
  /** Maximum value for `number` / `currency` / `percent`. */
  maxValue?: number;
  /** Selectable options for `select` / `multiselect`. */
  options?: { id: string; label: string }[];
  /**
   * Force `select` fields to render as a searchable ComboBox. When
   * omitted, fields auto-upgrade once `options.length > 10`.
   */
  searchable?: boolean;
  /** Default value applied on create. */
  defaultValue?: unknown;
  /** Column span in the form grid (1-2, defaults to 2 = full row). */
  colSpan?: 1 | 2;
  /** Optional section title — starts a new field group. */
  section?: string;
  /**
   * Phone-input options (only read when `kind === "phone"`).
   * `defaultIso2` seeds the country picker; defaults to the app-wide
   * fallback in `phone-countries.ts`.
   */
  phone?: {
    defaultIso2?: string;
  };
  /**
   * Rich-text options (only read when `kind === "richtext"`).
   * `maxLength` caps character count and toggles the "over limit"
   * state on the footer counter.
   */
  richtext?: {
    maxLength?: number;
    isReadOnly?: boolean;
  };
  /**
   * File-upload options (only read when `kind === "file"`).
   * All optional — sensible defaults keep the drop zone functional
   * without any per-field config.
   */
  file?: {
    /** Native `<input accept>` filter, e.g. `"image/*,.pdf"`. */
    accept?: string;
    /** Allow multiple selections. Defaults to `false`. */
    multiple?: boolean;
    /** Maximum accepted file size in bytes. */
    maxSize?: number;
    /** Maximum accepted file count. */
    maxFiles?: number;
  };
};

// ---------------------------------------------------------------------------
// Multi-step form definitions (§7.2 — Medusa-style ProgressTabs default)
// ---------------------------------------------------------------------------

/**
 * How a create/edit form lays out its sections.
 *
 * - `single`  — every section stacked vertically on one page. The
 *               legacy layout kept for one-section forms and any
 *               module that opts out explicitly.
 * - `tabs`    — sections grouped into steps and rendered through
 *               `<ProgressTabs>`. This is the **new default** whenever
 *               a module has 2+ distinct `section` values on its
 *               fields — matching the Medusa admin create-form UX.
 * - `accordion` — steps rendered through `<ProgressAccordion>`,
 *                 useful for variable-step forms where later steps
 *                 depend on earlier ones (invoice creation with line
 *                 items, athlete onboarding with document uploads).
 *
 * Setting `formLayout` explicitly always wins over auto-derivation.
 */
export type FormLayoutMode = "single" | "tabs" | "accordion";

/**
 * A single step in a multi-step form.
 *
 * A step is either **derived** from `sections` (a set of section names
 * mapped straight from `FieldSchema.section`), or a **custom** step
 * (currently only `review`) that renders a synthesised summary from
 * the values entered in prior steps.
 *
 * When `formSteps` is omitted on the manifest and `formLayout` is
 * `"tabs"` or `"accordion"`, `GenericFormPage` auto-derives one step
 * per unique `section` value, in the order sections first appear on
 * the field list.
 */
export type FormStep = {
  /** Stable id. Used for `Tabs.Panel` keys and status tracking. */
  id: string;
  /** Human-readable label shown on the tab / accordion header. */
  label: string;
  /** Optional translation key overriding `label`. */
  labelKey?: string;
  /** Optional icon token (Iconify / gravity-ui). */
  icon?: string;
  /**
   * Step type — drives what renders inside the panel:
   *
   *   - `"fields"` (default): render the fields whose `section` value
   *     matches one of `sections`. Every field-level control shows
   *     up normally; the step's `status` chip flips to `complete`
   *     once every required field in the step has a value.
   *   - `"review"`: render a read-only summary card of every value
   *     entered so far. No form fields — the step is always
   *     `complete` by construction (Refine's own submit-time
   *     validation is the safety net).
   */
  type?: "fields" | "review";
  /**
   * Section names (matching `FieldSchema.section`) to include in this
   * step. Required for `type === "fields"`. Ignored when
   * `type === "review"`.
   */
  sections?: string[];
  /**
   * Whether this step must be `complete` before the form can submit.
   * Defaults to `true`. Set `false` for optional sections (e.g. an
   * "Advanced" tab that users can skip on create).
   */
  isRequired?: boolean;
  /** Optional description shown under the step header. */
  description?: string;
};

/** Empty-state copy shown when a listing has no rows. */
export type EmptyStateCopy = {
  title: string;
  description?: string;
  /** Optional CTA button label rendered next to the empty state. */
  actionLabel?: string;
  /** Route to navigate to when the CTA is pressed. Defaults to `${list}/create`. */
  actionRoute?: string;
};

/** A single tab declaration for the detail (show) page. */
export type DetailTabConfig = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: string;
};

/**
 * A filter chip rendered above the DataGrid (§5.6). Presenting the user with a
 * quick way to narrow the listing. When a chip is toggled on, its `filter` is
 * pushed into Refine's `useTable` filters array.
 */
export type FilterChipConfig = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: string;
  /** Iconify token colour hint — accent / success / warning / danger / default. */
  color?: "accent" | "success" | "warning" | "danger" | "default";
  /** Refine filter to apply when active. */
  filter: {
    field: string;
    operator: "eq" | "ne" | "contains" | "gte" | "lte";
    value: unknown;
  };
};

/** A user-facing saved view — a named preset of filters + sorters (§5.6). */
export type SavedViewConfig = {
  id: string;
  label: string;
  labelKey?: string;
  /** Refine filters to apply. */
  filters?: { field: string; operator: "eq" | "ne" | "contains" | "gte" | "lte"; value: unknown }[];
  /** Refine sorters to apply. */
  sorters?: { field: string; order: "asc" | "desc" }[];
  /** When true, the view is selected on first mount. */
  isDefault?: boolean;
};

/**
 * A related-records widget that renders inside the detail-page Overview tab
 * (§6.1 point 7). Fetches from `resource` with a filter that joins on the
 * current record's id.
 */
export type RelatedRecordsConfig = {
  id: string;
  label: string;
  labelKey?: string;
  /** Resource to query — e.g. `"training-sessions"` for an athlete's recent sessions. */
  resource: string;
  /** Field on the related resource that references the parent record's id. */
  foreignKey: string;
  /** Optional cell projection — falls back to name / status / date. */
  columns?: {
    id: string;
    header: string;
    field: string;
    kind?: "text" | "date" | "chip" | "money";
  }[];
  /** Max rows to show inline. Defaults to 5. */
  limit?: number;
  /** Optional "View all" href — falls back to `/<resource>?<foreignKey>=<id>`. */
  viewAllHref?: string;
};

/** HoverCard preview kind — maps a foreign-key cell to a canonical preview. */
export type ReferenceKind =
  | "athlete"
  | "coach"
  | "staff"
  | "team"
  | "invoice"
  | "lead"
  | "facility"
  | "credential"
  | "branch"
  | "season";

/**
 * CRUD level a resource opts into. `"full"` (the default) auto-registers
 * `list`, `create`, `show`, and `edit` routes. `"read-only"` skips `create`
 * and `edit`. `"none"` disables auto-registration entirely — the module owns
 * every route in its `routes` array.
 */
export type ResourceCrudLevel = "full" | "read-only" | "list-only" | "none";

// ---------------------------------------------------------------------------
// Resource meta
// ---------------------------------------------------------------------------

/** The Academorix-specific resource metadata. */
export type AppResourceMeta = {
  /** Default nav label; overridden per tenant by a `terminology` map later. */
  label: string;
  /** Singular form of `label` — used in "Create X" and page titles. Defaults to a naive singular of `label`. */
  singularLabel?: string;
  /** Iconify token — bare names resolve to Gravity UI. */
  icon?: string;
  /** Sidebar bucket. Resources without a group land in `"other"` and warn in dev. */
  groupKey?: SidebarGroupKey;
  /** Sort order in the sidebar (ascending; default `0`). */
  order?: number;
  /** Tenant feature-toggle key; hidden unless enabled. */
  featureKey?: string;
  /** Permission required to see / enter (e.g. `"athletes.viewAny"`). */
  requiredPermission?: string;
  /** Refine multi-data-provider key (defaults to `"default"`). */
  dataProviderName?: string;
  /** Parent resource name for nav grouping. */
  parent?: string;
  /** Working-scope dimensions (`"organization"`, `"branch"`, `"season"`). */
  scopes?: string[];
  /**
   * Which scope dimensions this resource's list query is filtered by
   * at fetch time. Passed to `buildScopeFilters(scope, scopedBy)` in
   * `ResourceGrid` so the data provider only returns rows for the
   * active organization / branch / season.
   *
   * Kept separate from `scopes` because `scopes` is the CHROME hint
   * (which scope switchers to render for this resource) while
   * `scopedBy` is the DATA hint (which filters to append to the
   * `useTable` request). The tenant axis is fixed by the host/identity
   * so it doesn't appear here — tenant scoping is enforced globally.
   *
   * The tuple mirrors `ScopeDimension` from `@/lib/scope/scope.types`
   * so `buildScopeFilters(scope, meta.scopedBy)` accepts the value
   * without a cast.
   */
  scopedBy?: ("organization" | "branch" | "season")[];
  /** Renders a `Coming soon` chip in the sidebar. */
  comingSoon?: boolean;
  /** Keyboard shortcuts owned by this resource (leader-key). */
  shortcuts?: AppResourceShortcuts;
  /** Extra ⌘K commands beyond the automatic Navigate / Create. */
  commands?: AppResourceCommand[];
  /** Row-level actions rendered in the row overflow menu. Merged with defaults. */
  rowActions?: AppResourceRowAction[];
  /** Bulk actions rendered in the floating ActionBar. Merged with defaults. */
  bulkActions?: AppResourceBulkAction[];
  /** Optional description shown in the palette + listing hero. */
  description?: string;
  /** Optional description translation key. */
  descriptionKey?: string;
  /** Optional field schema for create/edit forms. When absent, fields are inferred from a sample row. */
  formFields?: FieldSchema[];
  /**
   * Layout mode for the create/edit form. Defaults to `"tabs"` when
   * `formFields` has 2+ distinct sections (Medusa-style default),
   * `"single"` otherwise. Set explicitly to override.
   *
   * See {@link FormLayoutMode} for the full contract.
   */
  formLayout?: FormLayoutMode;
  /**
   * Explicit step layout. When omitted, `GenericFormPage` derives one
   * step per unique `section` value on the fields. Provide this when
   * you want custom step ordering, merged sections in one step, a
   * final "Review" step, or optional (`isRequired: false`) sections.
   *
   * See {@link FormStep} for the full contract.
   */
  formSteps?: FormStep[];
  /** Optional per-module empty-state copy for the listing. */
  emptyState?: EmptyStateCopy;
  /** Custom tabs on the detail page. Defaults to Overview / Activity / Settings. */
  detailTabs?: DetailTabConfig[];
  /** Filter chips rendered above the DataGrid (§5.6). */
  filterChips?: FilterChipConfig[];
  /** Named saved views (a Segment above the grid) — §5.6. */
  savedViews?: SavedViewConfig[];
  /**
   * Fields to run a free-text `contains` filter against when the
   * search box on the listing page emits a debounced value. Kept as
   * an array because most people-shaped resources want to match a
   * query across e.g. `["fullName", "email"]` or
   * `["name", "subject"]`. The `ResourceGrid` composes one Refine
   * `or` filter with a `contains` predicate per field, so multi-
   * field entries behave as a single search bar spanning every
   * axis the resource cares about.
   *
   * When omitted or empty, the listing renders no search input at
   * all — the resource is opt-in.
   */
  searchFields?: string[];
  /**
   * Placeholder text for the listing's search input. Defaults to
   * `Search {label}...` when omitted, so most modules do not need
   * to set it. Override when the resource has a domain-specific
   * hint that makes the affordance discoverable (e.g. `Search by
   * SKU or barcode…`).
   */
  searchPlaceholder?: string;
  /** Related records rendered inside the detail-page Overview tab (§6.1 point 7). */
  relatedRecords?: RelatedRecordsConfig[];
  /**
   * CRUD level this resource opts into. Controls whether the registry
   * auto-registers `create` and `:id/edit` routes for the resource. Defaults
   * to `"full"` — the shell wires all four routes automatically.
   */
  crud?: ResourceCrudLevel;
  /**
   * Suppress the default row and bulk actions (View / Edit / Duplicate /
   * Delete / Export / Archive) for this resource. Use when the module wants
   * a completely bespoke action set.
   */
  suppressDefaultActions?: boolean;
  /**
   * Enable row virtualisation on this resource's `DataGrid`. Set on
   * modules that routinely serve 200+ rows (people / notifications /
   * training sessions in production tenants) so the DOM stays small
   * even when the page reveals hundreds of rows.
   *
   * Requires `virtualizedRowHeight` + `virtualizedHeaderHeight` when
   * the visual rhythm of the row deviates from the defaults (`42` / `36`).
   * The `ResourceGrid` forwards these onto `<DataGrid>` verbatim.
   */
  virtualized?: boolean;
  /** Fixed row height in pixels for virtualised grids. Defaults to `42`. */
  virtualizedRowHeight?: number;
  /** Header row height in pixels for virtualised grids. Defaults to `36`. */
  virtualizedHeaderHeight?: number;
};

/**
 * A Refine resource whose `meta` is strongly typed as {@link AppResourceMeta}.
 * The registry casts these to Refine's `ResourceProps` at the `<Refine>`
 * boundary (Refine's `meta.icon` is a `ReactNode`; ours is a string token).
 */
export type AppResource = Omit<ResourceProps, "meta"> & { meta: AppResourceMeta };

// ---------------------------------------------------------------------------
// Module contract
// ---------------------------------------------------------------------------

/**
 * A feature module: the resources it registers and the routes it serves.
 * Default-exported from each `src/modules/<name>/<name>.module.ts`.
 */
export type AppModule = {
  /** Lowercase module name, matching the backend module (e.g. `"athletes"`). */
  name: string;
  /** Refine resources contributed by this module. */
  resources?: AppResource[];
  /** Routes contributed by this module. */
  routes?: AppRoute[];
  /**
   * Optional settings fields this module contributes to the Settings module.
   * Aggregated at boot by the module registry, exposed to the settings
   * subsystem via `appSettings`. In production these are pushed to the
   * backend as the source-of-truth for the schema; the JSON fixture at
   * `src/refine/data/settings-schema.json` mocks the API response.
   */
  settings?: ModuleSettingField[];
  /**
   * Additional dashboard widgets this module contributes to the
   * shared widget catalogue. Each contribution declares its
   * catalogue metadata alongside the `render` factory the widget
   * renderer should call — the module registry hands both to the
   * dashboard module at boot so the widget is self-registered.
   *
   * Widgets contributed here appear in the customise panel's
   * catalogue drawer, on templates that reference their key, and in
   * every widget-count / illustration surface exactly like the
   * built-in widgets. See {@link DashboardWidgetContribution} for
   * the shape.
   *
   * @example
   * ```ts
   * import type {AppModule} from "@/lib/module";
   * import {TrainingLoadChart} from "./widgets/training-load-chart";
   *
   * const module: AppModule = {
   *   name: "training",
   *   dashboardWidgets: [
   *     {
   *       key: "training-load-week",
   *       cohort: "custom",
   *       title: "Training load — this week",
   *       description: "Aggregate training load across every squad.",
   *       icon: "chart-line",
   *       span: "half",
   *       render: () => <TrainingLoadChart />,
   *     },
   *   ],
   * };
   *
   * export default module;
   * ```
   */
  dashboardWidgets?: DashboardWidgetContribution[];
};

/**
 * Shape of a widget contributed via {@link AppModule.dashboardWidgets}.
 * Extends the catalogue entry with a mandatory `render` factory so a
 * module can ship the widget's component alongside its metadata in
 * one manifest. The module registry hands `render` off to the
 * dashboard's `registerWidgetRenderer` at boot, so consumers pick up
 * the widget through the shared renderer table without special
 * casing.
 *
 * Imported by reference (not by value) to keep this file's runtime
 * dependencies to zero — the dashboard module still owns every
 * catalogue-related import.
 */
export interface DashboardWidgetContribution {
  /** Stable catalogue key — must be unique across every module. */
  key: string;
  /**
   * Cohort bucket the widget lives in. Any string is accepted —
   * both the seven built-in cohorts and cohorts registered via
   * `registerCohort` at boot.
   */
  cohort: string;
  title: string;
  description: string;
  /** Iconify token — bare = Gravity UI, prefixed = external set. */
  icon: string;
  /** Grid width hint — matches the built-in widget catalogue. */
  span: "full" | "half" | "third";
  /**
   * Whether the widget is enabled by default on a new user's
   * layout. Almost always `false` on module-contributed widgets.
   */
  defaultEnabled?: boolean;
  /**
   * Factory returning the React tree to render. Kept as a
   * nullary function (not a component reference) so the factory
   * can close over module-scope state at call time and stay
   * portable across React fast-refresh.
   */
  render: () => ReactNode;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/**
 * The React node Refine expects for `meta.icon`. Kept as a re-export so
 * consumers upstream don't have to import React types just to type-annotate.
 */
export type ResourceIconNode = ReactNode;

// ---------------------------------------------------------------------------
// Shared route paths (folded in from the retired `lib/module/` folder)
// ---------------------------------------------------------------------------

/**
 * Cross-cutting route paths referenced outside any single feature module —
 * chiefly auth provider redirect targets, host-specific landing pages, and the
 * Slack-style workspace picker. Feature modules define their own resource
 * paths inside their manifests; only genuinely shared destinations belong here.
 */
export const appRoutes = {
  /** Public landing page (tenant host) / workspace picker (central host). */
  home: "/",
  /** Default post-login destination. */
  dashboard: "/dashboard",

  // --- Tenant auth surface (served under `{slug}.academorix.app`) ------
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  verifyEmailNotice: "/verify-email-notice",
  confirmPassword: "/settings/security/confirm-password",
  changePassword: "/settings/security/change-password",

  // --- Platform admin auth surface (served under `admin.academorix.app`) ----
  twoFactorSetup: "/2fa/setup",
  twoFactorChallenge: "/2fa/challenge",
  twoFactorRecoveryCodes: "/settings/security/recovery-codes",

  // --- Central host (workspace picker + self-serve tenant creation) --------
  workspacePicker: "/",
  findWorkspaces: "/find-workspaces",
  createWorkspace: "/create-workspace",
} as const;

/** Union of the shared route path strings. */
export type AppRoutePath = (typeof appRoutes)[keyof typeof appRoutes];
