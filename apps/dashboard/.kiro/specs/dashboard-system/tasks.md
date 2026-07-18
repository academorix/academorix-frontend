# Implementation Plan

Living checklist for the per-user dashboard system landing in
`refine-heroui-pro`. Every task is either **done** (`[x]`), **pending** (`[ ]`),
or **skipped** (`[skip]`). When a task lands, tick the box and add the primary
file references in italics so a future audit can trace the change.

## Overview

Ship a Raycast-style command palette + Notion-grade dashboard system on top of
`refine-heroui-pro`. Every user gets a per-account dashboard document (name,
icon, colour, layout mode, widget list, filters) persisted through a storage
adapter that swaps `localStorage` for the Refine data provider when the backend
lands. Built-in Overview + Analytics dashboards stay curated; users can
duplicate, rename, pin, share, or delete their own. Sharing has two orthogonal
axes:

- **In-app access** (`shareLevel`) — `private` / `shared` / `role-restricted`
- **Public embed** (`visibility`) — anonymous read-only viewer via signed token

The customise panel is a six-tab inspector docked in the shell's aside slot
(Widgets / Layout / Settings / History / Filters / Assistant). Presenter mode is
a `chromeless`-tier route that renders each pinned dashboard as a full-viewport
slideshow. Version history writes a snapshot before every mutation so any past
state is restorable. Widget annotations pin plain-text comments per widget
instance. Keyboard-first navigation, an AI copilot, and per-widget filter
overrides round out the feature set.

## Tasks

### A. Foundation

- [x] **A1** JSON dashboard document model + typed contract
      _`src/modules/dashboard/dashboards/types.ts`_
- [x] **A2** localStorage storage adapter with embed tokens _`storage.ts`_
- [x] **A3** Built-in dashboards + templates _`defaults.ts`_
- [x] **A4** Slug helper (unique + reserved-word aware) _`slugify.ts`_
- [x] **A5** `useDashboards` list + CRUD hook _`use-dashboards.ts`_
- [x] **A6** `useCurrentDashboard` slug resolver _`use-current-dashboard.ts`_
- [x] **A7** `useDashboardEditor` draft + undo/redo + save
      _`use-dashboard-editor.ts`_
- [x] **A8** Public barrel for the domain module _`dashboards/index.ts`_

### B. Shell + navigation

- [x] **B1** Aside-slot renderer store (React-19-safe)
      _`src/lib/aside-slot.tsx`_
- [x] **B2** AppShell wired to the aside store + resizable panel
      _`src/components/app-shell.tsx`_
- [x] **B3** Pinned custom dashboards inside sidebar Overview group
      _`src/components/app-sidebar.tsx`_
- [x] **B4** Embed route tier lifted above the shell _`src/router.tsx`,
      `lib/module.ts`_
- [x] **B5** Dashboard module manifest (index + slug + embed routes)
      _`dashboard.module.ts`_

### C. Dashboard page

- [x] **C1** Scrollable tabs with overflow buttons + fade masks
      _`components/dashboard-tabs.tsx`_
- [x] **C2** Header with title / shared chip / Share + Customise buttons
      _`pages/dashboard.tsx`_
- [x] **C3** Filter chip bar under the tabs
      _`components/dashboard-filter-bar.tsx`_
- [x] **C4** Editable dashboard canvas _`components/dashboard-canvas.tsx`_
- [x] **C5** Sortable widget with drag / resize / actions
      _`sortable-widget.tsx`_
- [x] **C6** Widget vector illustrations catalogue
      _`components/widget-illustrations.tsx`_
- [x] **C7** Public embed viewer (no shell chrome) _`pages/embed.tsx`_

### D. Customise panel

- [x] **D1** Six-tab inspector (Widgets / Layout / Settings / History / Filters
      / Assistant) _`components/customize-panel.tsx`_
- [x] **D2** Widget-catalogue drawer with search + previews
      _`components/widget-catalogue-drawer.tsx`_
- [x] **D3** Share dialog with embed-token issue / revoke
      _`components/share-dashboard-dialog.tsx`_
- [x] **D4** New Dashboard dialog with template picker
      _`components/new-dashboard-dialog.tsx`_
- [x] **D5** Save / discard / undo / redo footer

### E. Cleanup

- [x] **E1** Re-wire widget illustrations into panel + drawer
      _`components/widget-catalogue-drawer.tsx`,
      `components/customize-panel.tsx`_
- [x] **E2** Fix nested `<button>` warning in tabs dropdown
      _`components/dashboard-tabs.tsx`_
- [x] **E3** Rename duplicate `G I` shortcut (notifications → `G N`)
      _`modules/notifications/notifications.module.ts`_

### F. UX enhancements

- [x] **F1** Density toggle (compact / cozy / comfortable) per dashboard
      _`dashboards/types.ts`, `use-dashboard-editor.ts`,
      `dashboards/storage.ts`, `components/dashboard-canvas.tsx`,
      `components/customize-panel.tsx`_
- [x] **F2** Widget catalogue extensions — module-manifest contributed widgets
      _`lib/module.ts`, `modules/registry.ts`, `widgets.catalogue.ts`,
      `widget-renderer.tsx`_
- [x] **F3** Widget-level filter override (per-instance scope + date)
      _`sortable-widget.tsx`, `components/widget-filter-drawer.tsx`,
      `components/dashboard-canvas.tsx`_
- [x] **F4** Template gallery visuals in New Dashboard dialog
      _`components/new-dashboard-dialog.tsx`, `dashboards/defaults.ts`_
- [x] **F5** Keyboard-first widget nav (Tab / Space / Delete / arrows)
      _`dashboards/use-widget-keyboard-nav.ts`,
      `components/dashboard-canvas.tsx`, `sortable-widget.tsx`_

### G. Feature slices

- [x] **G1** Version history restore UI (backend already stores snapshots)
      _`components/version-history-dialog.tsx`,
      `components/customize-panel.tsx`_
- [x] **G2** Widget annotations / comments store + hover pins
      _`components/widget-annotations-popover.tsx`, `sortable-widget.tsx`,
      `components/dashboard-canvas.tsx`_
- [x] **G3** Presenter mode — full-screen slideshow of pinned dashboards
      _`pages/present.tsx`, `dashboard.module.ts`, `pages/dashboard.tsx`,
      `src/lib/module.ts`, `src/router.tsx`_
- [x] **G4** AI copilot dock — 6th customise panel tab _`dashboards/ai-mock.ts`,
      `dashboards/types.ts`, `components/ai-copilot-tab.tsx`,
      `components/customize-panel.tsx`_
- [x] **G5** Role-based dashboard permissions in share dialog
      _`dashboards/types.ts`, `dashboards/storage.ts`, `dashboards/defaults.ts`,
      `dashboards/index.ts`, `dashboards/use-dashboards.ts`,
      `components/share-dashboard-dialog.tsx`, `src/components/app-sidebar.tsx`_

### H. Verification

- [x] **H1** TypeScript project check clean on every dashboard module file
      _`pnpm exec tsc -p tsconfig.app.json --noEmit`_
- [x] **H2** Production Vite build clean (`pnpm build`)
- [skip] **H3** End-to-end share flow via headless probe — deferred, needs
  Playwright infra

## Task Dependency Graph

```
A1 ─┬─▶ A2 ─▶ A3 ─▶ A5 ─▶ A6 ─▶ A7 ─▶ A8
    └─▶ A4 ─┘

B1 ─▶ B2 ─▶ B4 ─▶ B5
              └─▶ B3

A8 + B5 ─▶ C1 ─▶ C2 ─▶ C3 ─▶ C4 ─▶ C5 ─▶ C6 ─▶ C7
                              └─▶ D1 ─▶ D2 ─▶ D3
                                          └─▶ D4
                                          └─▶ D5

C5 + C6 ─▶ E1
C1      ─▶ E2
registry ─▶ E3

A7      ─▶ F1
lib/module + registry + widgets.catalogue ─▶ F2
C5      ─▶ F3 ─▶ (widget-filter-drawer)
D4      ─▶ F4
C4 + C5 ─▶ F5

A2 + D1 ─▶ G1 (version-history-dialog)
A2 + C5 ─▶ G2 (annotations)
B4 + C4 ─▶ G3 (present)
D1      ─▶ G4 (ai copilot)
D3      ─▶ G5 (role-based grants)

Every green task ─▶ H1 ─▶ H2 (─▶ H3, deferred)
```

## Legend

- `[x]` — merged / shipped
- `[ ]` — pending
- `[skip]` — out of scope / deferred

## Notes

- Shared files (`sortable-widget.tsx`, `customize-panel.tsx`,
  `dashboards/types.ts`, `dashboards/storage.ts`) are touched by multiple tasks.
  When two tasks land in parallel via sub-agents, they either target different
  files or the shared surface is patched by the primary agent, then extended by
  follow-ups.
- Every feature that persists new state extends the same `Dashboard` JSON
  contract in `types.ts` — never a new storage key. Consistency lets the
  eventual backend swap stay a single-file change on `storage.ts`.

## Progress log

### Sub-agent D report (final cleanup + F/G features)

Sub-agent D shipped **E1, E2, F1, F2, F3, F4, G2** plus the final task tracker
cleanup pass.

- **E1** — the widget-catalogue drawer + the customise panel's Widgets tab now
  render the `WidgetIllustration` component on every row.
- **E2** — the tab overflow trigger is wrapped in `Dropdown.Trigger` + `Button`
  in the canonical HeroUI Pro compound pattern so React no longer sees a nested
  `<button>` at the DOM level.
- **E3** — notifications shortcut renamed to `G N` in the module manifest.
- **F1** — density toggle (`compact | cozy | comfortable`) surfaced in Settings
  tab, persisted on the Dashboard document, applied to the canvas gap classes.
- **F2** — modules can now contribute widgets via a new
  `AppModule.dashboardWidgets` array. Registry aggregates them at boot and the
  widget-renderer registry gains a runtime `register()` entry point.
- **F3** — per-widget filter override lives in a compact `WidgetFilterDrawer`
  opened from the sortable widget's overflow menu.
- **F4** — the New Dashboard dialog renders per-template thumbnail strips using
  the existing WidgetIllustration cohort fallbacks.
- **G2** — widget annotations popover with add / edit / delete, wired to the
  storage adapter methods already in place, plus a comment-count badge on each
  sortable widget.

### Sub-agent C report (G4 + F5)

Sub-agent C shipped **G4 (AI copilot dock)** and **F5 (Keyboard-first widget
nav)**.

- Created `dashboards/ai-mock.ts`, `components/ai-copilot-tab.tsx`, and
  `dashboards/use-widget-keyboard-nav.ts`.
- Extended `dashboards/types.ts` (new `AiSuggestion*` + `AiTurn` + expanded
  `CustomizePanelTab` union), `dashboards/index.ts` re-exports, and the
  `customize-panel.tsx` / `dashboard-canvas.tsx` / `sortable-widget.tsx` hosts.

### Sub-agent B report (G3 + G5)

Sub-agent B shipped **G3 (Presenter mode)** and **G5 (Role-based dashboard
permissions)**.

- Created `pages/present.tsx`.
- Extended `lib/module.ts` with the `chromeless` tier, `router.tsx` lifted
  chromeless routes above `<App>`, `dashboard.module.ts` registered
  `/dashboard/present`, and `pages/dashboard.tsx` added the Present button.
- Extended `dashboards/types.ts` with `DashboardShareLevel` +
  `DashboardShareGrant` + `CreateShareGrantInput` and the three new adapter
  methods, `dashboards/storage.ts` implemented the grant store + cascade,
  `dashboards/defaults.ts` seeded `shareLevel: "private"` on the built-ins,
  `dashboards/index.ts` exported `canAccessDashboard`, and
  `dashboards/use-dashboards.ts` published the grant mutators + tenant-wide
  `shareGrants` snapshot. `share-dashboard-dialog.tsx` gained the "Who can see
  this dashboard" section; `app-sidebar.tsx` filters pinned rows through
  `canAccessDashboard`.
