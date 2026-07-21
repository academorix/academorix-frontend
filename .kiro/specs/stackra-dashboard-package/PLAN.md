# `@stackra/dashboard` — package plan (v1)

Single package that owns the customisable dashboard subsystem for every
`@stackra/*` app: **widget registry**, **widget renderer registry**, **custom
dashboards (CRUD + persistence)**, **share grants + access model**, **version
history + annotations**, **embed tokens + broadcast (public viewer / kiosk)**,
and the **canvas customisation state machine** (add / remove / reorder / resize
widgets, layouts per breakpoint, density presets).

Ports every feature that currently lives under
`apps/dashboard/src/modules/dashboard/` into a first-class publishable package,
so any app can drop `DashboardModule.forRoot({...})` and get the full surface.

## Phasing

Two phases so the split matches the agent lanes:

- **Phase 1 — this task — framework-core-builder** builds:
  - `core/` — every domain type, adapter, service, registry, error, util, config
    trio, and the DI module.
  - `react/hooks/` + `react/providers/` + `react/contexts/` — headless React
    bindings (no visual UI).
  - `testing/` — fixtures + in-memory adapter for consumer tests.
  - `contracts/` additions — 5 tokens + metadata keys (mirrors queue).
- **Phase 2 — heroui-ui-builder** builds:
  - `react/components/` — every visual component (`Canvas`, `CustomizePanel`,
    `WidgetTile`, `DashboardTabs`, `NewDialog`, `ShareDialog`,
    `VersionHistoryDialog`, `WidgetCatalogueDrawer`, `WidgetFilterDrawer`,
    `WidgetAnnotationsPopover`, `AiAssistantSheet`, `AiCopilotTab`,
    illustrations) on HeroUI Pro primitives via `@stackra/ui/react`. Kept out of
    scope in Phase 1 so this task doesn't cross the agent boundary.

`apps/dashboard/` continues to work throughout — Phase 1 is non-destructive (the
existing `src/modules/dashboard/` code stays); Phase 2 migrates the app to
consume the package + deletes the old module.

## Source → package mapping

Every path below is `apps/dashboard/src/modules/dashboard/*` in the current
codebase.

| Current                                                  | New home in `packages/dashboard/`                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `dashboards/types.ts` (interfaces)                       | `core/interfaces/*.interface.ts` (one per shape)                                |
| `dashboards/types.ts` (`type X = …` unions)              | `core/types/*.type.ts`                                                          |
| `dashboards/types.ts` (error classes)                    | `core/errors/*.error.ts`                                                        |
| `dashboards/defaults.ts` (`DASHBOARD_TEMPLATES`)         | `core/constants/dashboard-templates.constants.ts`                               |
| `dashboards/defaults.ts` (`BUILT_IN_*_ID`)               | `core/constants/built-in-ids.constants.ts`                                      |
| `dashboards/defaults.ts` (`GRID_COLUMNS`)                | `core/constants/grid-columns.constants.ts`                                      |
| `dashboards/defaults.ts` (`buildOverviewDashboard`)      | `core/utils/build-overview-dashboard.util.ts`                                   |
| `dashboards/defaults.ts` (`buildAnalyticsDashboard`)     | `core/utils/build-analytics-dashboard.util.ts`                                  |
| `dashboards/defaults.ts` (`materialiseTemplate`)         | `core/utils/materialise-template.util.ts`                                       |
| `dashboards/defaults.ts` (`autoLayout`, private)         | `core/utils/auto-layout.util.ts` (exported for tests)                           |
| `dashboards/defaults.ts` (`stableInstance`, priv.)       | `core/utils/stable-widget-instance.util.ts`                                     |
| `dashboards/defaults.ts` (`buildLayoutsForKeys`)         | `core/utils/build-layouts-for-keys.util.ts`                                     |
| `dashboards/slugify.ts` (`slugify`)                      | `core/utils/slugify.util.ts`                                                    |
| `dashboards/slugify.ts` (`ensureUniqueSlug`)             | `core/utils/ensure-unique-slug.util.ts`                                         |
| `dashboards/storage.ts` (`LocalStorageDashboardStorage`) | `core/adapters/local-storage-dashboard.adapter.ts`                              |
| `dashboards/storage.ts` (`dashboardStorage`)             | Provided via DI, not a top-level singleton (see "Module" below)                 |
| `dashboards/storage.ts` (crypto helpers)                 | `core/utils/sha256-hex.util.ts` + `constant-time-equals.util.ts`                |
| `dashboards/storage.ts` (id helpers)                     | `core/utils/random-id.util.ts` + `random-token.util.ts`                         |
| `dashboards/storage.ts` (unlock-session helpers)         | `core/services/embed-unlock-session.service.ts` (in-memory, DI'd)               |
| `dashboards/storage.ts` (normalise helpers)              | `core/utils/normalise-*.util.ts`                                                |
| `dashboards/storage.ts` (storage-key literals)           | `core/constants/storage-keys.constants.ts`                                      |
| `dashboards/index.ts` (`canAccessDashboard`)             | `core/utils/can-access-dashboard.util.ts`                                       |
| `dashboards/use-dashboards.ts`                           | `react/hooks/use-dashboards/`                                                   |
| `dashboards/use-current-dashboard.ts`                    | `react/hooks/use-current-dashboard/`                                            |
| `dashboards/use-dashboard-editor.ts`                     | `react/hooks/use-dashboard-editor/`                                             |
| `dashboards/use-widget-keyboard-nav.ts`                  | `react/hooks/use-widget-keyboard-nav/`                                          |
| `dashboards/ai-mock.ts` (`generateAiSuggestions`)        | `core/services/ai-suggestion-mock.service.ts` (mock; overrideable)              |
| `widgets.catalogue.ts` (WIDGET_CATALOGUE, COHORTS)       | `core/services/widget-registry.service.ts` (class-based registry)               |
| `widgets.catalogue.ts` (`registerWidget`, etc.)          | Methods on `WidgetRegistry` service                                             |
| `widget-renderer.tsx`                                    | `core/services/widget-renderer-registry.service.ts` + `react/hooks/use-widget/` |
| `dashboard.module.ts` (app-level Refine manifest)        | Stays in the app (routing / Refine resource lives with the consumer app)        |
| `components/*.tsx`                                       | **Phase 2** — `react/components/`                                               |
| `pages/*.tsx`                                            | **Stays in app** — pages are route composition, not framework                   |
| `sortable-widget.tsx`                                    | **Phase 2** — `react/components/sortable-widget/`                               |

## Package scaffold (mirrors `@stackra/queue`)

```
packages/dashboard/
├── LICENSE
├── README.md
├── package.json                 # exports: `.`, `./react`, `./testing`
├── tsconfig.json                # extends ../tsconfig.base.json, paths @/* → ./src/*
├── tsup.config.ts               # defineBaseConfig({ index, react, testing })
├── vitest.config.ts             # merges @stackra/testing/preset
├── __tests__/
│   └── vitest.setup.ts
├── config/                      # empty for now; kept for parity with @stackra/queue
└── src/
    ├── core/
    │   ├── index.ts             # public API barrel (only owned symbols)
    │   ├── dashboard.module.ts  # @Module — forRoot + forRootAsync + forFeature (widget contributions)
    │   ├── constants/
    │   │   ├── index.ts
    │   │   ├── default-dashboard-config.constants.ts     # DEFAULT_DASHBOARD_CONFIG
    │   │   ├── built-in-ids.constants.ts                 # BUILT_IN_OVERVIEW_ID / _ANALYTICS_ID
    │   │   ├── grid-columns.constants.ts                 # GRID_COLUMNS
    │   │   ├── overview-widget-keys.constants.ts         # OVERVIEW_WIDGET_KEYS
    │   │   ├── analytics-widget-keys.constants.ts        # ANALYTICS_WIDGET_KEYS
    │   │   ├── dashboard-templates.constants.ts          # DASHBOARD_TEMPLATES seed
    │   │   ├── reserved-slugs.constants.ts               # RESERVED_SLUGS
    │   │   ├── storage-keys.constants.ts                 # localStorage key prefixes
    │   │   └── playground-identity.constants.ts          # PLAYGROUND_OWNER_ID / _TENANT_ID (defaults for the local adapter)
    │   ├── interfaces/
    │   │   ├── index.ts
    │   │   ├── dashboard.interface.ts                    # IDashboard (+ related shape family)
    │   │   ├── dashboard-module-options.interface.ts     # IDashboardModuleOptions (root + owner/tenant identity + storage driver select + widget contribution seed)
    │   │   ├── dashboard-storage-adapter.interface.ts    # IDashboardStorageAdapter (the whole persistence contract)
    │   │   ├── dashboard-manager.interface.ts            # IDashboardManager (thin domain service on top of the adapter)
    │   │   ├── widget-registry.interface.ts              # IWidgetRegistry
    │   │   ├── widget-renderer-registry.interface.ts     # IWidgetRendererRegistry
    │   │   ├── widget-entry.interface.ts                 # IWidgetEntry
    │   │   ├── cohort-entry.interface.ts                 # ICohortEntry
    │   │   ├── widget-instance.interface.ts              # IWidgetInstance
    │   │   ├── layout-item.interface.ts                  # ILayoutItem
    │   │   ├── renderable-layout.interface.ts            # IRenderableLayout
    │   │   ├── dashboard-filters.interface.ts            # IDashboardFilters
    │   │   ├── dashboard-share-grant.interface.ts        # IDashboardShareGrant
    │   │   ├── dashboard-version-snapshot.interface.ts   # IDashboardVersionSnapshot
    │   │   ├── widget-annotation.interface.ts            # IWidgetAnnotation
    │   │   ├── embed-token-record.interface.ts           # IEmbedTokenRecord (+ Phase-1..4 fields — family group)
    │   │   ├── issued-embed-token.interface.ts           # IIssuedEmbedToken
    │   │   ├── public-embed-dashboard.interface.ts       # IPublicEmbedDashboard
    │   │   ├── unlocked-embed-session.interface.ts       # IUnlockedEmbedSession
    │   │   ├── broadcast-template.interface.ts           # IBroadcastTemplate
    │   │   ├── broadcast-view-log-record.interface.ts    # IBroadcastViewLogRecord
    │   │   ├── bulk-revoke-filters.interface.ts          # IBulkRevokeFilters
    │   │   ├── bulk-revoke-result.interface.ts           # IBulkRevokeResult
    │   │   ├── ai-suggestion.interface.ts                # IAiSuggestion
    │   │   ├── ai-turn.interface.ts                      # IAiTurn
    │   │   ├── dashboard-nav-entry.interface.ts          # IDashboardNavEntry
    │   │   ├── dashboard-template.interface.ts           # IDashboardTemplate (seed template for "new" dialog)
    │   │   ├── dashboard-access-subject.interface.ts     # IDashboardAccessSubject
    │   │   ├── create-dashboard-input.interface.ts       # ICreateDashboardInput
    │   │   ├── update-dashboard-input.interface.ts       # IUpdateDashboardInput
    │   │   ├── create-share-grant-input.interface.ts     # ICreateShareGrantInput
    │   │   ├── issue-embed-token-input.interface.ts      # IIssueEmbedTokenInput
    │   │   ├── unlock-embed-token-input.interface.ts     # IUnlockEmbedTokenInput
    │   │   └── create-broadcast-template-input.interface.ts # ICreateBroadcastTemplateInput
    │   ├── types/
    │   │   ├── index.ts
    │   │   ├── dashboard-breakpoint.type.ts              # 'lg' | 'md' | 'sm'
    │   │   ├── dashboard-visibility.type.ts              # 'private' | 'shared'
    │   │   ├── dashboard-share-level.type.ts             # 'private' | 'shared' | 'role-restricted'
    │   │   ├── dashboard-layout-mode.type.ts             # 'grid' | 'flow'
    │   │   ├── dashboard-density.type.ts                 # 'compact' | 'cozy' | 'comfortable'
    │   │   ├── broadcast-kind.type.ts                    # 'embed' | 'present'
    │   │   ├── customize-panel-tab.type.ts               # 'widgets' | 'layout' | 'settings' | 'history' | 'filters'
    │   │   ├── ai-suggestion-kind.type.ts                # 'add-widget' | 'reorder' | 'rename' | 'explain'
    │   │   ├── widget-cohort.type.ts                     # OSS cohort keys + open string
    │   │   └── widget-span.type.ts                       # 'full' | 'half' | 'third'
    │   ├── errors/
    │   │   ├── index.ts
    │   │   ├── optimistic-lock.error.ts                  # OptimisticLockError
    │   │   ├── dashboard-not-found.error.ts              # DashboardNotFoundError
    │   │   ├── embed-token-invalid.error.ts              # EmbedTokenInvalidError
    │   │   └── embed-token-password-required.error.ts    # EmbedTokenPasswordRequiredError
    │   ├── services/
    │   │   ├── index.ts
    │   │   ├── dashboard-manager.service.ts              # DashboardManager (@Injectable; the front door — thin over the adapter, but adds cross-adapter behaviour like the built-in synthesis)
    │   │   ├── widget-registry.service.ts                # WidgetRegistry (@Injectable, extends BaseRegistry<WidgetEntry>; registerWidget / registerCohort / list / byCohort / find / defaultLayout)
    │   │   ├── widget-renderer-registry.service.ts       # WidgetRendererRegistry (@Injectable; register + resolve of renderer factories keyed by widget id)
    │   │   ├── dashboard-access.service.ts               # thin OO wrapper around canAccessDashboard for consumers who prefer DI
    │   │   ├── embed-unlock-session.service.ts           # In-memory Map<sessionKey, EmbedUnlockSessionRecord>; expiry-aware read/write; scoped per container
    │   │   └── ai-suggestion-mock.service.ts             # AI mock (matches ai-mock.ts); overridable via DI so real AI can slot in
    │   ├── adapters/
    │   │   ├── index.ts
    │   │   ├── local-storage-dashboard.adapter.ts        # LocalStorageDashboardAdapter (implements IDashboardStorageAdapter)
    │   │   ├── in-memory-dashboard.adapter.ts            # InMemoryDashboardAdapter (SSR + test)
    │   │   └── null-dashboard.adapter.ts                 # NullDashboardAdapter (throws with a helpful message)
    │   ├── utils/
    │   │   ├── index.ts
    │   │   ├── define-config.util.ts                     # defineConfig<T>(...) — typed identity for config authoring
    │   │   ├── merge-config.util.ts                      # mergeConfig — one place defaults are applied
    │   │   ├── slugify.util.ts
    │   │   ├── ensure-unique-slug.util.ts
    │   │   ├── auto-layout.util.ts
    │   │   ├── stable-widget-instance.util.ts
    │   │   ├── build-layouts-for-keys.util.ts
    │   │   ├── build-overview-dashboard.util.ts
    │   │   ├── build-analytics-dashboard.util.ts
    │   │   ├── materialise-template.util.ts
    │   │   ├── can-access-dashboard.util.ts              # pure fn (no I/O) — used by the service + hooks
    │   │   ├── sha256-hex.util.ts
    │   │   ├── constant-time-equals.util.ts
    │   │   ├── random-id.util.ts
    │   │   ├── random-token.util.ts
    │   │   ├── normalise-string-list.util.ts
    │   │   ├── normalise-whitelabel.util.ts
    │   │   ├── normalise-layouts.util.ts
    │   │   ├── normalise-dashboard.util.ts
    │   │   ├── is-built-in-dashboard.util.ts             # narrow guard used by the adapter
    │   │   ├── widget-span-lookup.util.ts                # widgetSpan(key, registry) helper
    │   │   └── get-dashboard-storage-token.util.ts       # token-lookup helper (parallels queue's getQueueToken)
    │   └── decorators/
    │       ├── index.ts
    │       ├── inject-dashboard-storage.decorator.ts     # @InjectDashboardStorage()
    │       ├── inject-dashboard-manager.decorator.ts     # @InjectDashboardManager()
    │       ├── inject-widget-registry.decorator.ts       # @InjectWidgetRegistry()
    │       ├── widget.decorator.ts                       # @Widget({ key, cohort, title, ... }) — class decorator using createDiscoverableClassDecorator from @stackra/decorators
    │       └── on-dashboard-event.decorator.ts           # @OnDashboardEvent('save' | 'restore' | ...) — method-level, optional
    ├── react/
    │   ├── index.ts                                      # public API barrel for the react subpath
    │   ├── contexts/
    │   │   ├── index.ts
    │   │   └── dashboard/
    │   │       ├── index.ts
    │   │       ├── dashboard.context.ts                  # DashboardContext (React.createContext)
    │   │       └── dashboard-context-value.interface.ts  # IDashboardContextValue
    │   ├── providers/
    │   │   ├── index.ts
    │   │   └── dashboard/
    │   │       ├── index.ts
    │   │       ├── dashboard.provider.tsx                # <DashboardProvider owner={...} tenant={...} children={...} /> — reads the container, provides the context value
    │   │       └── dashboard-provider.interface.ts       # IDashboardProviderProps
    │   └── hooks/
    │       ├── index.ts
    │       ├── use-dashboards/
    │       │   ├── index.ts
    │       │   ├── use-dashboards.hook.ts                # useDashboards() — main hook (port of app version)
    │       │   └── use-dashboards.interface.ts           # IUseDashboardsResult
    │       ├── use-current-dashboard/
    │       │   ├── index.ts
    │       │   ├── use-current-dashboard.hook.ts         # useCurrentDashboard(slug?) — resolves by slug / default
    │       │   └── use-current-dashboard.interface.ts    # IUseCurrentDashboardResult
    │       ├── use-dashboard-editor/
    │       │   ├── index.ts
    │       │   ├── use-dashboard-editor.hook.ts          # useDashboardEditor(dashboard, persist) — draft reducer
    │       │   └── use-dashboard-editor.interface.ts     # IUseDashboardEditor + EditorPersistFn
    │       ├── use-widget-keyboard-nav/
    │       │   ├── index.ts
    │       │   ├── use-widget-keyboard-nav.hook.ts       # useWidgetKeyboardNav() — kb nav a11y (port)
    │       │   └── use-widget-keyboard-nav.interface.ts  # IUseWidgetKeyboardNav + IWidgetKeyboardProps
    │       ├── use-widget/
    │       │   ├── index.ts
    │       │   └── use-widget.hook.ts                    # useWidget(key) — looks up the widget entry + renderer factory from the registries
    │       ├── use-widget-registry/
    │       │   ├── index.ts
    │       │   └── use-widget-registry.hook.ts           # useWidgetRegistry() — returns the DI WidgetRegistry
    │       └── use-can-access-dashboard/
    │           ├── index.ts
    │           └── use-can-access-dashboard.hook.ts      # useCanAccessDashboard(dashboard, subject?) — wraps the pure util
    └── testing/
        ├── index.ts
        ├── mock-dashboard.util.ts                        # createMockDashboard(overrides?)
        ├── mock-widget-instance.util.ts                  # createMockWidgetInstance(overrides?)
        ├── mock-widget-entry.util.ts                     # createMockWidgetEntry(overrides?)
        └── in-memory-dashboard-adapter.util.ts           # createTestDashboardAdapter() — clean per-test instance
```

## Contracts additions (`packages/contracts/src/`)

Mirrors the queue idiom: **tokens + metadata keys only**. Feature package owns
its full interface tree.

`tokens/dashboard.tokens.ts`:

```typescript
/** Token for the DashboardManager singleton. */
export const DASHBOARD_MANAGER = Symbol.for("DASHBOARD_MANAGER");

/** Token for the dashboard module configuration. */
export const DASHBOARD_CONFIG = Symbol.for("DASHBOARD_CONFIG");

/** Token for the DashboardStorageAdapter — swap between local / in-memory / null / remote. */
export const DASHBOARD_STORAGE = Symbol.for("DASHBOARD_STORAGE");

/** Token for the WidgetRegistry singleton. */
export const WIDGET_REGISTRY = Symbol.for("WIDGET_REGISTRY");

/** Token for the WidgetRendererRegistry singleton. */
export const WIDGET_RENDERER_REGISTRY = Symbol.for("WIDGET_RENDERER_REGISTRY");

/** Metadata key for the `@Widget()` class decorator. */
export const WIDGET_METADATA_KEY = "stackra:dashboard:widget";

/** Metadata key for the `@OnDashboardEvent()` method decorator. */
export const ON_DASHBOARD_EVENT_METADATA_KEY = "stackra:dashboard:on-event";
```

Wire it up in `packages/contracts/src/tokens/index.ts`.

## `DashboardModule` — DI wiring

```typescript
DashboardModule.forRoot({
  // Storage — one of these + drivers registered via forFeature
  storage: 'localStorage' | 'in-memory' | 'null',
  // Or supply a concrete adapter class:
  storageClass?: Type<IDashboardStorageAdapter>,

  // Identity — how the storage adapter attributes new dashboards / grants / etc.
  identity?: {
    ownerId?: string;    // default: 'playground-user'
    tenantId?: string;   // default: 'playground-tenant'
  },

  // Built-ins to auto-materialise per user. Defaults to Overview + Analytics.
  builtIns?: readonly ('overview' | 'analytics')[],

  // Templates surfaced in the "New dashboard" dialog. Defaults to the shipped catalogue.
  templates?: readonly IDashboardTemplate[],

  // Widget seed — modules can contribute additional widgets via forFeature too.
  widgets?: readonly IWidgetEntry[],
  cohorts?: readonly ICohortEntry[],

  // Feature flags
  enableEmbed?: boolean;            // default: true
  enableBroadcast?: boolean;        // default: true
  enableAiSuggestions?: boolean;    // default: false (mock is opt-in)
});
```

`forRootAsync` — same options behind a factory, mirroring queue.

`forFeature` — bind widgets + renderers at module boundaries. Uses the shared
`createSeedLoader` + `seedLoaderToken('dashboard-widget:<key>')` so the
container schedules registration on `onApplicationBootstrap` (never a
`useFactory` side effect that returns `true`).

```typescript
DashboardModule.forFeature({
  cohorts: [{ key: 'training', label: 'Training', ... }],
  widgets: [
    { entry: { key: 'training-progress', cohort: 'training', ...}, render: () => <TrainingProgress /> },
    { entry: { key: 'training-agenda',  cohort: 'training', ...}, render: () => <TrainingAgenda /> },
  ],
});
```

## Lifecycle contract

- `WidgetRegistry` implements `OnModuleInit` — seeds the OSS catalogue from
  `DASHBOARD_CONFIG.widgets` if present, and the shipped defaults otherwise.
- Widget/renderer contributions from `forFeature` are seeded via
  `createSeedLoader` (mirrors `@stackra/queue` + `@stackra/cache`).
- `WidgetRendererRegistry` implements the same `OnModuleInit` contract — seeds
  the OSS renderers.
- No bootstrap-provider classes. No side effects in constructors. No
  `useFactory: () => { doWork(); return true; }`.

## Public API — barrels

**`src/core/index.ts`** exports only package-owned symbols. Never re-exports
contracts (per `contract-reexports.md`):

- Module: `DashboardModule`
- Services: `DashboardManager`, `WidgetRegistry`, `WidgetRendererRegistry`,
  `DashboardAccessService`, `EmbedUnlockSessionService`,
  `AiSuggestionMockService`
- Adapters: `LocalStorageDashboardAdapter`, `InMemoryDashboardAdapter`,
  `NullDashboardAdapter`
- Errors: `OptimisticLockError`, `DashboardNotFoundError`,
  `EmbedTokenInvalidError`, `EmbedTokenPasswordRequiredError`
- Utilities: `defineConfig`, `mergeConfig`, `slugify`, `ensureUniqueSlug`,
  `canAccessDashboard`, `materialiseTemplate`, `buildOverviewDashboard`,
  `buildAnalyticsDashboard`, `autoLayout`
- Constants: `DEFAULT_DASHBOARD_CONFIG`, `GRID_COLUMNS`, `BUILT_IN_OVERVIEW_ID`,
  `BUILT_IN_ANALYTICS_ID`, `DASHBOARD_TEMPLATES`
- Decorators: `Widget`, `OnDashboardEvent`, `InjectDashboardStorage`,
  `InjectDashboardManager`, `InjectWidgetRegistry`
- Interfaces + types: every `IDashboard*` / `IWidget*` / `type X = …` shape
  (feature package owns its full type tree)

**`src/react/index.ts`** exports:

- Providers: `DashboardProvider`
- Contexts: `DashboardContext`
- Hooks: `useDashboards`, `useCurrentDashboard`, `useDashboardEditor`,
  `useWidgetKeyboardNav`, `useWidget`, `useWidgetRegistry`,
  `useCanAccessDashboard`

**`src/testing/index.ts`** exports the fixture factories.

## Support-utility conformance

Applies everywhere per `.kiro/steering/support-utilities.md`:

- **Strings** — use `Str.*` for case conversions, splits, replaces, trims,
  padding, slug (already a helper) — internally `slugify()` uses Str where it
  doesn't already conflict with the existing behaviour.
- **Arrays** — `Arr.wrap` / `Arr.pluck` / `Arr.groupBy` / `collect()` for
  chained pipelines. The auto-layout pass stays imperative (perf-critical enough
  that a `collect` chain would be a step down — mark with
  `// support-utilities-exempt: hot path` if the grep flags it).
- **Env** — `Env.get(...)` for any env var the adapter reads (there are none
  today; kept as a note for the future).
- **Timing / control-flow** — no hand-rolled `sleep` / `retry` / `once`. The
  unlock-session service already has no timers; keep it that way.
- **URLs** — `Uri.of(origin).path('broadcast').path(raw).toString()` replaces
  the template-literal `${origin}/broadcast/${raw}` in the adapter's
  `issueEmbedToken` return value.

## Code-standards conformance

- **One export per file**, suffix per kind, folder per category. See the
  scaffold above — every `.interface.ts` under `interfaces/`, every `.util.ts`
  under `utils/`, every `.service.ts` under `services/`, every `.type.ts` under
  `types/`, every `.error.ts` under `errors/`, every `.constants.ts` under
  `constants/`.
- **Composite family grouping** — `embed-token-record.interface.ts` holds
  `IEmbedTokenRecord` + the family shapes it wholly owns (`IEmbedWatermark`,
  `IEmbedWhitelabel`) since they are used only as parts of the record. Same for
  `dashboard.interface.ts` if the outer references shapes that aren't consumed
  elsewhere.
- **No default exports.** Every barrel is `export {…}` / `export type {…}`.
  Config files at the package root are the only grandfathered exception
  (`tsup.config.ts` / `vitest.config.ts`).
- **Every folder has an `index.ts` barrel.** Barrels are re-export only — no
  declarations, no side effects.
- **Every React entity in its own folder.** Providers under
  `react/providers/<name>/<name>.provider.tsx`; contexts under
  `react/contexts/<name>/<name>.context.ts`; hooks under
  `react/hooks/<name>/<name>.hook.ts`.

## Documentation conformance

- **Every source file starts with a `@file` / `@module` / `@description` block**
  (per `.kiro/steering/documentation.md`).
- **JSDoc on every export.** Classes get `@example`; methods get `@param` /
  `@returns` / `@throws`; interfaces get per-property JSDoc; constants get a
  one-line summary; DI tokens name the interface they bind. React components /
  hooks / providers get an `@example` of the intended import path.
- **Detailed inline comments** on non-obvious flow, fail-soft paths, ordering
  constraints (the storage adapter has plenty — keep them, port faithfully).
- **Section dividers** in longer classes (`// ── Public API ─────`, etc.) —
  mirror `network.service.ts`.

## Module-lifecycle conformance

- Zero `class *Bootstrap` — the registry seeds itself via `onModuleInit`,
  feature contributions via `createSeedLoader`.
- Zero synthetic `_BOOTSTRAP` tokens.
- Every `useFactory` returns a real value (a lifecycle loader when the intent is
  side-effect-only).

## Testing plan

`__tests__/` + `src/testing/` cover:

- **`slugify.spec.ts`** — round-trip, reserved-slug fallback, 60-char cap.
- **`ensure-unique-slug.spec.ts`** — collision resolution, ignore-slug
  behaviour.
- **`in-memory-dashboard-adapter.spec.ts`** — every method on the storage
  contract: list / get / getBySlug / create / update / remove / duplicate /
  togglePin / setDefault / issueEmbedToken / revokeEmbedToken / rotateEmbedToken
  / resolveEmbedToken / unlockEmbedToken / listShareGrants / addShareGrant /
  removeShareGrant / listVersions / restoreVersion / listAnnotations /
  addAnnotation / updateAnnotation / removeAnnotation / listBroadcastTemplates /
  createBroadcastTemplate / deleteBroadcastTemplate / previewBulkRevoke /
  bulkRevokeEmbedTokens / listBroadcastViewLog.
- **`optimistic-lock.spec.ts`** — every mutation path throws when the client
  version is stale.
- **`can-access-dashboard.spec.ts`** — owner override, admin override, private,
  shared, role-restricted × grant types (role / user / everyone).
- **`widget-registry.spec.ts`** — register / dedupe / find / byCohort /
  defaultLayout.
- **`widget-renderer-registry.spec.ts`** — register / resolve /
  first-registration-wins.
- **`dashboard.module.spec.ts`** — forRoot wiring + forFeature widget
  contribution (via the seed-loader path) + config trio merge with defaults.
- **Cross-package smoke** — a minimal `TestingModule.compile()` that binds
  `DashboardModule.forRoot({ storage: 'in-memory' })` and asserts every service
  is resolvable by its contracts token.

## Migration plan (Phase 1 only — non-destructive)

1. Add contracts additions (`packages/contracts/src/tokens/dashboard.tokens.ts`
   - include in the tokens barrel). Bump `@stackra/contracts` version (minor) +
     write a changeset.
2. Scaffold `packages/dashboard/` (package.json / tsconfig.json / tsup.config.ts
   / vitest.config.ts / README.md / LICENSE / config/ /
   src/{core,react,testing}/index.ts placeholders).
3. Port `core/`:
   - Constants (`GRID_COLUMNS`, IDs, template seeds, storage keys, defaults).
   - Types (unions) + interfaces (shapes) + errors (classes).
   - Utils (slug + build helpers + normalisers + crypto + id helpers).
   - Services (registries + manager + access + unlock session + AI mock).
   - Adapters (local-storage + in-memory + null).
   - Module (`DashboardModule.forRoot` + `forRootAsync` + `forFeature`).
4. Port `react/`:
   - Contexts (`DashboardContext`).
   - Providers (`<DashboardProvider>` — resolves the DI services into the
     context value).
   - Hooks (`useDashboards` / `useCurrentDashboard` / `useDashboardEditor` /
     `useWidgetKeyboardNav` / `useWidget` / `useWidgetRegistry` /
     `useCanAccessDashboard`).
5. Populate `testing/` with fixture factories + `createTestDashboardAdapter`.
6. Write tests per the plan above.
7. `pnpm --filter @stackra/contracts build` →
   `pnpm --filter @stackra/dashboard typecheck build test`. Fix everything until
   green.
8. Add a changeset for `@stackra/dashboard@0.1.0` (initial minor).

## Non-goals (Phase 1)

- No `react/components/` — Phase 2 (heroui-ui-builder). The package ships with
  an empty `react/components/` **placeholder folder** to reserve the subpath
  name; no exports from it until Phase 2.
- No migration of `apps/dashboard/src/modules/dashboard/**` — the app keeps
  working against its local module until Phase 2 swaps the imports over. Verify
  `pnpm --filter @stackra/dashboard build` after the package is done (should
  still be green — no imports touch the new package yet).
- No routing (`pages/*.tsx` stay in the app; routing is app-shaped Refine /
  react-router composition, not framework).
- No chart-widget components (KpiCards, RevenueChart, DisciplineChart,
  UpcomingSessions, RecentActivity, OnboardingChecklist, widget-shims) — those
  are app-specific data-fetching widgets. They register themselves via
  `DashboardModule.forFeature` from the app.

## Cross-cuts

- **HeroUI Pro rule** (`.kiro/steering/ui-components.md`) applies in Phase 2
  only. Phase 1 ships no visual UI.
- **Support utilities rule** applies fully — every string / array / number / URL
  / env / timing call goes through `@stackra/support`.
- **Package conventions rule** applies — config trio
  (`DEFAULT_DASHBOARD_CONFIG` + `defineConfig` + `mergeConfig`), `forRoot` +
  `forRootAsync` + `forFeature` wired via `createSeedLoader`, `Manager` /
  `BaseRegistry` bases where they fit (widget registry extends
  `BaseRegistry<IWidgetEntry>`).
