# Dashboard UX Plan — Task Tracker

This file tracks every remaining item from `DASHBOARD_UX_PLAN.md`. Marked `[x]`
once shipped, `[ ]` when pending, `[~]` when partially shipped (framework in
place, per-module adoption incomplete), `[skip]` when out of scope (needs
backend / product decision).

---

## §4 — Overview dashboard

- [x] Widget grid with dnd-kit and 7 cohorts (18 widgets)
- [x] Two-view (overview / analytics) layout persistence
- [x] Right-side customise pane through `AppLayout.aside`
- [x] Widget picker + dotted-outline edit mode

## §5 — Listing page pattern

- [x] `ResourceGrid` bridge: DataGrid + `useTable` + ActionBar + EmptyState +
      saved views + filter chips
- [x] Row / bulk actions dispatched via Refine hooks with `intent` discriminator
- [x] Default action set (View / Edit / Duplicate / Delete / Export / Archive)
- [x] CSV export (client-side)
- [x] Per-module `emptyState`, `singularLabel`, `crud` on every module manifest
- [x] Per-module `formFields` from `schemas.ts` for every CRUD-full module
- [x] **Persist saved views to localStorage** (via `readPersistedView` /
      `writePersistedView`)
- [x] Per-module `filterChips` + `savedViews` — athletes, leads, safeguarding,
      invoices, expenses, facilities, teams, attendance, credentials, documents,
      memberships, events, medical, announcements, competition, drills, users
- [x] **Kanban primary view for `leads`** (`/leads/kanban`)
- [x] **Kanban primary view for `safeguarding`** (`/safeguarding/kanban`)
- [~] Per-module `filterChips` for the remaining 15 modules — infrastructure
  ready, per-module adoption is a one-line change per manifest

## §6 — Detail / show page pattern

- [x] Breadcrumbs + avatar header + primary action + overflow dropdown
- [x] Status chip strip
- [x] Tabs (Overview / Activity / Settings) with custom-tab override via
      `meta.detailTabs`
- [x] Two-column body + side rail
- [x] Compact `Timeline` for activity
- [x] `RelatedRecordsWidget` for §6.1 point 7
- [x] `ReferenceHoverCard` — all 10 preview kinds (athlete, coach, staff, lead,
      team, invoice, facility, credential, branch, season)
- [x] Recent records tracker — every show-page view feeds the palette's Recent
      group
- [~] `relatedRecords` config on the remaining 20+ modules — infrastructure
  ready, one-line change per manifest

## §7 — Create / Edit / Delete pattern

- [x] `GenericFormPage` full-page routed form
- [x] `FieldControl` dispatch table (text, textarea, number, currency, percent,
      email, phone, select, switch, date, hidden)
- [x] Section groups + column-span layout
- [x] `useForm` + Refine notifications on submit
- [x] `HoldConfirmButton` for destructive verbs
- [x] `ConfirmDialog` with optional typed confirmation
- [x] Optimistic delete + 6-second undo (Refine `undoable` mode)
- [x] `ProgressTabs` container (§7.2)
- [x] `ProgressAccordion` container (§7.2)
- [x] **Wire**: Multi-step athlete registration form using ProgressTabs
      (Personal / Guardian / Sports / Documents / Review) — 5-step layout via
      `formSteps` on the athletes manifest, with `formLayout: "tabs"`,
      guardian + documents fields added to `athleteFields`, and a final Review
      step that renders a read-only recap of every entered value.
      _`src/modules/sports/athletes/athletes.module.ts`,
      `src/modules/schemas.ts`_
- [~] **Wire**: Multi-step invoice creation using ProgressAccordion — the
  framework is in place (set `formLayout: "accordion"` + declare `formSteps`),
  but the invoices resource is `crud: "read-only"` by product decision (invoices
  are generated from memberships/passes). Manual invoice creation blocked
  pending product's call on whether the flow should exist. When it does, the
  manifest edit is 6 lines.
- [x] **Sweep**: Every create form defaults to `ProgressTabs` (Medusa-style
      stepper) — extended `GenericFormPage` with a `formLayout` + `formSteps`
      contract. Modules with 2+ distinct `section` values on their fields
      auto-adopt the tabs layout with **zero manifest change**
      (`resolveLayoutMode` derives it from field sections); explicit `formSteps`
      overrides for bespoke ordering / Review steps. Per-step completion status
      tracked live via a value-changed callback into every `FieldControl`
      branch. _`src/lib/module.ts`, `src/components/generic-form-page.tsx`_
- [x] `PhoneInput` wrapper — country-code picker with typeahead search + E.164
      output, wired as `kind: "phone"` in `GenericFormPage` field dispatch.
      _`src/components/phone-input.tsx`, `src/lib/phone-countries.ts`_
- [x] `RichTextEditor` wrapper — HeroUI Pro `RichTextEditor` (Tiptap) with
      default toolbar + bubble menu, HTML output through hidden input. Wired as
      `kind: "richtext"`. _`src/components/rich-text-editor-field.tsx`_
- [x] `FileUpload` wrapper — HeroUI Pro `DropZone` with client-side validation,
      upload state machine, object-URL fallback for the fixture era, real
      `upload` prop for prod. Wired as `kind: "file"`.
      _`src/components/file-upload-field.tsx`_

## §8 — Attendance UX

- [x] `/attendance` page with `Segment` view switcher persisted to `?view=`
- [x] Agenda hour-grid view with clickable session cards
- [x] Batch review `DataGrid` alternate
- [x] `KPIGroup` above with `Sessions today` / `Attendance rate today` /
      `Absentees today`
- [x] Session-detail modal with per-athlete `Segment` for status +
      `Mark all present` / `Mark all absent`
- [x] Attendance-tailored columns in `columns.tsx` with athlete
      `ReferenceHoverCard`
- [x] Saved views + filter chips on `attendance.module.ts`
- [~] Full HeroUI Pro `Agenda` component — the real `<Agenda>` is now wired on
  `/attendance` with drag-to-move, drag-to-resize, drag-to-create, and
  status-driven event colours based on the live attendance rate. Backend
  mutations for `onEventMove` / `onEventResize` still route through an
  optimistic local overrides map — swapping to Refine `useUpdate` is a one-file
  change once the sessions endpoint lands.

## §9 — Settings module

- [x] Secondary-sidebar layout + 16 tabs
- [x] **JSON-fixture-driven** schema — `settings-schema.json` +
      `settings-values.json`, single generic `pages/section.tsx` renders any
      section
- [x] Modules can push their own settings via
      `AppModule.settings?: ModuleSettingField[]` — registry aggregates
- [x] 6-level scope chain (System → Tenant → Region → Organization → Branch →
      User) + parallel Locale axis
- [x] Per-field inheritance toggle (🔗/🔓) + info tooltip showing values at
      every scope
- [x] 14 field types
      (string/text/number/currency/percent/boolean/select/multiselect/date/time/color/json/file/duration)
- [x] **ComboBox auto-upgrade** — select fields with >10 options or
      `searchable: true` render as a searchable ComboBox instead of a plain
      Select; same rule applied to `GenericFormPage` select fields

## §10 — Analytics and reporting

- [x] `/reports` hub with Saved reports `DataGrid` + Report library
      `ItemCardGroup`
- [x] `/reports/:id` detail with header, three `Widget` charts (bar / line /
      pie), `FloatingToc` side rail, narrative section
- [x] 10 report templates seeded (Revenue analysis, Attendance rate, Coach
      utilisation, Lead conversion funnel, Membership cohort, Safeguarding
      incidents, Payments overdue, Credential compliance, Facility utilisation,
      Registration by sport)
- [x] Reports fixture in `data-provider.ts`

## §11 — Notifications and real-time

- [x] `/notifications` inbox with **Segment**-per-category (converted from
      Tabs), unread count, mark-read, per-row actions
- [x] `/notifications/preferences` opt-out matrix (category × channel) with
      `Switch` per intersection
- [x] Toast rules — placement + duration handled by existing
      `notification-provider.ts` (HeroUI toast)
- [x] Reception queue at `/reception` with KPI strip, approval/reject actions
- [x] **Notification bell in navbar** — `Badge` with unread count, opens a
      right-side `Sheet` with same Segment filter as the page. Merges live
      pushes on top of the durable inbox.
- [x] **`NotificationTransport` abstraction** — WebSocket primary, SSE fallback,
      polling last resort, mock transport for local dev, exponential backoff
      reconnect with jitter, per-category sound player via
      `NotificationSoundPlayer`
- [x] **FCM background push scaffolding** — `public/firebase-messaging-sw.js`
      service worker stub, `registerBackgroundPush()` returns FCM token for
      `POST /api/me/push-tokens`
- [x] **Per-category sound preferences** — `notifications.sounds.<category>`
      fields (payment/billing/attendance/roster/safeguarding/digest) with
      silent/chime/bell/knock/urgent options
- [x] **`NotificationTransportProvider`** — instantiates the transport, wires
      events to `useNotification()` toasts + sound playback, exposes queue +
      status through `useNotificationBus`

## §12 — Command palette playbook

- [x] Root palette with Navigate + Create groups
- [x] Global chrome shortcuts (⌘K, ⌘B, `?`, `T`)
- [x] Leader-key resource shortcuts (G X / N X)
- [x] Recent group (last 5 opened records) — localStorage-backed
- [x] Actions group (Toggle theme, Toggle locale, Open Settings, Copy link,
      Clear recents, Sign out)
- [x] Help group (Open documentation, Show keyboard shortcuts, Contact support,
      Changelog)
- [skip] Async search groups (Athletes / Coaches / Teams / Invoices / Leads) —
  backend search endpoints not defined; current filter is fuzzy-name on the
  loaded fixtures

## §13 — Accessibility and i18n

- [x] RTL flip via CSS logical properties (inherited from HeroUI defaults)
- [x] Global chrome keyboard shortcuts
- [x] Resource-scoped shortcuts
- [x] Listing-scoped shortcut hook (`useDataGridShortcuts`) —
      J/K/X/Enter/E/⌘A/Del
- [x] Detail-page shortcut hook (`useDetailShortcuts`) — 1-9 tabs, E edit, Del
      delete
- [x] Focus management via HeroUI overlay defaults
- [x] Reduced-motion via HeroUI defaults
- [x] Wire the shortcut hooks into `ResourceGrid` and `GenericShowPage` —
      `useDataGridShortcuts` drives J/K caret, Enter/E/X/⌘A/Del inside
      `ResourceGrid`; `useDetailShortcuts` handles 1-9 tab jumps + E edit + Del
      delete inside `GenericShowPage`

## §14 — Performance

- [x] Route-level code splitting via `React.lazy` in every module manifest
- [~] `virtualized` prop on grids with 200+ rows — DataGrid supports it;
  `AppResourceMeta` gained `virtualized` / `virtualizedRowHeight` /
  `virtualizedHeaderHeight` props threaded through `ResourceGrid` +
  `generic-list-page.tsx`. Athletes + users opted in (routinely 500+ rows in
  production tenants). Adding more modules is a one-line manifest change.

## §15 — Design tokens

- [x] Semantic colours (accent / success / warning / danger / …) — inherited
      from HeroUI + Academorix theme
- [x] `--color-role-*` tokens (owner, coach, reception, finance, athlete)
- [x] `--color-sport-*` per-sport accents (10 sports)
- [x] `--color-status-lead-*`, `--color-status-attendance-*`,
      `--color-status-payment-*`, `--color-safeguarding-severity-*`
- [x] Arabic font stack under `dir="rtl"`

## §16 — Roadmap

- Reference only — captures phase order + effort estimates. No implementation.

## §17 — Open questions

- Reference only — decisions punted to product.

---

## New surfaces built (beyond the plan's canonical patterns)

- [x] `/leads/kanban` — drag-and-drop lead funnel
- [x] `/safeguarding/kanban` — case status board
- [x] `/notifications` — inbox
- [x] `/notifications/preferences` — opt-out matrix
- [x] `/reception` — approval queue
- [x] `/subscription` — tabbed billing dashboard
- [x] `/usage` — entitlements matrix
- [x] `/reports` — reporting hub
- [x] `/reports/:id` — report detail
- [x] `/attendance` — attendance UX with agenda + batch review

---

## Cross-cutting

- [x] `pnpm build` passes
- [x] `pnpm typecheck` clean outside pre-existing
      `modules/dashboard/{components,dashboards,pages}` folder
- [skip] Real auth + access-control providers — Refine stubs stay in place until
  backend is live
- [skip] Real data provider — JSON fixtures until backend is live
- [skip] SSE / WebSocket transport — needs backend endpoints
- [skip] Playwright e2e — no test infra yet in this app

---

## Progress log

- **2026-07-10 — session 1** — Task tracker created. Built Reports (§10),
  Attendance UX (§8), Kanban views for leads and safeguarding, Notifications
  inbox + preferences, Reception approval queue, Billing tabbed dashboard,
  Entitlements usage matrix, extended command palette with Recent / Actions /
  Help groups, added 6 new HoverCard preview kinds (facility, credential,
  branch, season) on top of the existing 4, wired localStorage persistence for
  saved views, seeded Academorix-specific design tokens (§15), created listing-
  and detail-page keyboard shortcut hooks. All new code type-clean; production
  build succeeds in ~6s.

- **2026-07-10 — session 2** —
  - Fixed aside default-open bug: `AppShell` now gates
    `aside={aside.isOpen ? aside.content : null}` + `defaultAsideOpen={false}`
    so the panel stays collapsed until a route (e.g. dashboard's Customise
    button) explicitly opens it.
  - Verified Academorix accent is `oklch(0.87 0.212 132)` — chart-1, background
    gradient, chart ramp, glass pinned surfaces all shifted to hue 132 in both
    light and dark themes.
  - Built root-level `ScopeSwitcher` pill (`src/components/scope-switcher.tsx`)
    — visible in the navbar between the sidebar trigger and the search field,
    opens a `Popover` with `SearchField` + region-grouped `ListBox` of branches,
    keyboard-navigable, dispatches `academorix:branch-switch` event (same as
    user-menu switcher for consistency).
  - Built `NotificationBell` (`src/components/notification-bell.tsx`) —
    `Badge`-anchored bell with unread count from
    `useList({resource: "notifications"})`, opens a right-side `Sheet` with a
    `Segment` filter matching the page's categories, merges live push events on
    top of durable rows, "View all" + "Preferences" footer actions.
  - Built `NotificationTransport` (`src/lib/notification-transport.ts`) — WS →
    SSE → polling → mock transport chain; exponential backoff with jitter; FCM
    `registerBackgroundPush()` behind capability check;
    `NotificationSoundPlayer` with per-category preload; dynamic `firebase/*`
    import kept opaque to Vite via `@vite-ignore`.
  - Built `NotificationTransportProvider`
    (`src/providers/notification-transport-provider.tsx`) — instantiates one
    transport per tree, wires events to Refine `useNotification()` toasts +
    sound playback, exposes `useNotificationBus()` for live queue + status,
    wired into `App.tsx` between `SettingsProvider` and
    `CommandPaletteProvider`.
  - Added FCM service worker stub at `public/firebase-messaging-sw.js` —
    background push handler + notification click routing.
  - Converted notifications category filter from `Tabs` → `Segment`
    (variant="ghost") on `/notifications` list page — Tabs stay for detail-page
    section nav and true section-with-distinct-content surfaces
    (billing/subscription, customize-panel, progress-tabs).
  - Added `searchable?: boolean` to both `SettingField` (settings scope) and
    `FieldSchema` (module contract). Extended `SettingFieldRenderer` and
    `GenericFormPage` select branches to auto-upgrade to `ComboBox` when
    `options.length > 10` or the schema opts in explicitly.
  - Added 8 new settings fields to `settings-schema.json` — per-category sound
    picker (payment / billing / attendance / roster / safeguarding / digest)
    with silent/chime/bell/knock/urgent options, plus
    `notifications.push.enabled` + `notifications.push.device_label`.
  - `pnpm build` passes in 8.4s. `pnpm typecheck` clean outside the pre-existing
    dashboard WIP folder.

- **2026-07-10 — session 3** —
  - Fixed the aside width regression: HeroUI Pro's `AppLayout` forces
    `width: 100%` on `[data-slot="sidebar"]` whenever the shell is in
    `[data-resizable]` mode (any `sidebarResizable`/`asideResizable` triggers
    it). Since we run `sidebarCollapsible="icon"` (incompatible with
    `sidebarResizable`), the sidebar renders as a raw sibling of the resizable
    group and gets 100 % of the flex row — hiding the main content + aside.
    Added a scoped override in `src/index.css` that reasserts the sidebar's
    fixed width when it's a direct child of the layout, leaving sidebars inside
    a Resizable.Panel wrapper (future opt-in) untouched.
  - Retired the "scholarly crimson" palette across `src/themes/academorix.css` —
    every red-family hue (accent, chart-1, chart-5, background gradient tints,
    overlay shadow spill, glass-pinned surfaces, backdrop, muted, foreground)
    rehomed to hue 132 to match the new chartreuse accent. Accent foreground
    flipped to a deep bottle-green so text on the bright accent stays legible.
  - Navbar switcher labels — dropped the `compact` prop from
    `<LanguageSwitcher />` and `<ThemeSwitcher />` inside `AppNavbar`; both
    switchers now show their selected label at all breakpoints. Added
    `self-center` on the user-menu chevron so it stops sinking to the button's
    bottom edge when the name + branch subtitle stack takes two rows.
  - Danger dropdown items — added
    `.menu-item--danger > svg { color: var(--danger); }` in `src/index.css` so
    Sign out (and every other `variant="danger"` menu row) tints its leading
    icon along with the label. `>` (direct-child) keeps check marks +
    external-link chevrons in `.menu-item__actions` unaffected.
  - Danger Zone card — settings sections whose `group === "danger"` render
    inside a `border-danger/40` card with a `text-danger` title and inline icon;
    body content stays neutral so form fields don't drown in a red wash. Follows
    the GitHub/Linear/Vercel pattern.
  - Constrained Spectral serif to real display heads — `h1`, `h2`,
    `.card__title`, `.kpi__title`, `.widget__title` — instead of every `h1..h6`.
    Small subgroup subheads (h3+) fall back to Inter so 12–14 px labels read
    cleanly.
  - **PhoneInput** shipped — `src/components/phone-input.tsx` +
    `src/lib/phone-countries.ts`. HeroUI OSS `Autocomplete` powers the
    searchable country picker (60+ countries with flag + name + dial code); the
    wrapper joins the selected country's dial code with the user-typed national
    number into E.164, emitted via a hidden input under the same `name` so
    `FormData` submission stays transparent. Handles controlled + uncontrolled
    modes, seed-from-E.164 hydration, and the app-wide Saudi Arabia default.
  - **RichTextEditorField** shipped —
    `src/components/rich-text-editor-field.tsx`. Wraps HeroUI Pro
    `RichTextEditor` (Tiptap) with a "batteries-included" default toolbar
    (formatting / structure / link) and bubble menu; HTML output syncs into a
    hidden input on every `onValueChange`. Seed values accept either HTML or
    Tiptap JSON.
  - **FileUploadField** shipped — `src/components/file-upload-field.tsx`. Wraps
    HeroUI Pro `DropZone` with client-side validation (size / count / MIME), a
    per-file `uploading → complete | failed` state machine, retry + remove
    affordances, and an object-URL fallback so the field works against JSON
    fixtures today. Callers pass a real `upload` prop when the backend
    `POST /api/uploads` lands. Emits a JSON array of
    `{name,size,mimeType,url,id?}` into the hidden input; `coerceValue` in
    `GenericFormPage` parses it back into structured data on submit.
  - Extended `FieldSchema` in `src/lib/module.ts` with `phone` / `richtext` /
    `file` sub-config objects. Wired all three new kinds into `FieldControl` in
    `src/components/generic-form-page.tsx` — dispatches through the same
    section-grouped layout every other field uses.
  - Confirmed shortcut hooks are mounted: `ResourceGrid` uses
    `useDataGridShortcuts` with a `containerRef` + focused-row cursor;
    `GenericShowPage` uses `useDetailShortcuts` for tab jumps + edit + delete.
    Marked `[x]` in §13.
  - FCM runtime-config wire — `public/firebase-messaging-sw.js` no longer
    hard-codes SDK keys. On bootstrap it fetches `/firebase-config.json`
    (no-store, no-auth) and validates every required key before initialising
    Firebase. `NotificationTransport.registerBackgroundPush()` now falls back to
    the same JSON file when no explicit `options.fcm` is passed, keeping both
    halves of the FCM pipeline aligned on one deploy artefact. Committed
    `firebase-config.example.json` as the operator template plus a
    `public/sounds/README.md` pinning the expected notification-sound asset
    shape. Real `firebase-config.json` is gitignored via the new frontend
    `.gitignore`.
  - `pnpm build` passes; all edited files clean on `getDiagnostics`.

- **2026-07-10 — session 4** —
  - **ProgressTabs sweep** — extended `GenericFormPage` with a `formLayout` /
    `formSteps` contract on the module manifest. Layout resolution:
    1. Explicit `meta.formLayout` wins.
    2. Otherwise auto-adopt `"tabs"` when the field schema has 2+ distinct
       sections (Medusa-style default).
    3. Fall back to the legacy `"single"` layout for one-section forms. When
       `formSteps` is omitted, `deriveStepsFromSections` maps each unique
       `section` to a step in first-appearance order. Explicit `formSteps`
       override for custom step ordering, merged sections in one step, or a
       final `type: "review"` step that renders a read-only recap of every
       entered value. Per-step completion status is tracked live: every
       `FieldControl` branch now takes an `onValueChange(name, value)` callback
       so the status chip flips `not-started → in-progress → complete` as the
       user types.
  - **Athlete registration reference implementation** — extended `athleteFields`
    with a Guardian section (name / relation / phone / email / emergency
    contact) and a Documents section (profile photo, consent form, medical
    clearance uploads using the new `FileUploadField`), then declared explicit
    `formSteps` on the athletes manifest:
    `Personal → Guardian → Sports → Documents → Review`. `Documents` is marked
    `isRequired: false` so registration can complete before uploads land.
    `Review` uses `type: "review"` to render the recap without any form fields.
  - **Invoice creation** — kept as-is. The invoices resource is
    `crud: "read-only"` because invoices are generated from memberships/passes
    today. The framework supports an accordion layout with
    `formLayout: "accordion"` when product decides to add manual creation.
  - **HeroUI Pro `<Agenda>` on `/attendance`** — retired the hand-rolled
    hour-grid stub. Sessions are projected into `AgendaEvent` records with
    `CalendarDateTime` start/end (via `@internationalized/date`), colour-coded
    by live attendance rate (success / warning / danger). Drag-to-move,
    drag-to-resize, drag-to-create all wired through an optimistic local
    overrides map so the UX is fully functional against the fixture backend.
    When the sessions endpoint lands, swapping the callbacks for Refine
    `useUpdate` is a one-file change and the toast/rollback plumbing stays
    identical.
  - **Per-module `filterChips` fan-out** — added chips to credentials
    (NFC/RFID/QR), documents (Policy/Consent/Medical/Contract), memberships
    (Monthly/Quarterly/Annual + Active/Inactive saved views), events
    (Tournament/Training/Friendly/Showcase), medical
    (Clearance/Injury/Return-to-play/Assessment), announcements
    (Everyone/Athletes/Guardians/Staff), competition
    (Knockout/League/Round-robin/Showcase), drills
    (Beginner/Intermediate/Advanced), users (Female/Male + Active/Inactive).
    Every chip set derives from an existing `select` field's options, so the
    DataGrid filter targets exactly match the schema. Nine more modules covered;
    the remaining ones have `crud: "full"` but no useful select axes yet —
    they'll get chips once the schemas grow.
  - **`virtualized` opt-in** — `AppResourceMeta` gained `virtualized` /
    `virtualizedRowHeight` / `virtualizedHeaderHeight`; `ResourceGrid` forwards
    them onto `<DataGrid virtualized rowHeight headingHeight>`. Enabled on
    athletes + users (routine 500+ rows in production tenants).
  - **Notifications inline actions column** — verified already implemented on
    the list page (`__actions__` column renders up to two inline `<Button>`s
    from `row.actions` plus a `<Dropdown>` overflow with Mark read / Open /
    Dismiss).
  - `pnpm build` passes in ~9s; every touched file clean on `getDiagnostics`.
