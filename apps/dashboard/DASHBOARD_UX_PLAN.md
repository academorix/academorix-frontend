# Academorix Dashboard UX Plan

_Draft v1 · English only · Reference for the Academorix dashboard shell, listing
pages, detail pages, forms, and Settings module_

_This document is the single source of truth for how the authenticated
Academorix web app looks, feels, and behaves. Frontend engineers, designers, and
product owners pull component choices, page anatomies, keyboard shortcuts, empty
states, and settings schemas directly from here. Every recommendation cites the
exact component from `@heroui-pro/react`, `@heroui/react`, or
`@academorix/ui/react`, and the exact module folder under
`apps/web/src/modules/*` it applies to. Where a decision is still open, it
appears in Section 17 rather than being invented in prose._

---

## Table of Contents

- [0. Executive summary](#0-executive-summary)
- [1. Design principles](#1-design-principles)
- [2. Component inventory](#2-component-inventory)
  - [2.1 HeroUI Pro components](#21-heroui-pro-components)
  - [2.2 HeroUI OSS components](#22-heroui-oss-components)
  - [2.3 `@academorix/ui/react` custom components](#23-academorixuireact-custom-components)
  - [2.4 Pro vs OSS vs custom](#24-pro-vs-oss-vs-custom)
- [3. Global chrome](#3-global-chrome)
  - [3.1 Primary sidebar](#31-primary-sidebar)
  - [3.2 Secondary sidebar pattern](#32-secondary-sidebar-pattern)
  - [3.3 Top bar](#33-top-bar)
  - [3.4 Command palette](#34-command-palette)
  - [3.5 Notification center pattern](#35-notification-center-pattern)
- [4. Overview dashboard page](#4-overview-dashboard-page)
  - [4.1 Layout](#41-layout)
  - [4.2 Drag-and-drop widget grid](#42-drag-and-drop-widget-grid)
  - [4.3 Widget picker dialog](#43-widget-picker-dialog)
  - [4.4 Saved layouts](#44-saved-layouts)
  - [4.5 Full widget catalogue](#45-full-widget-catalogue)
  - [4.6 Onboarding checklist widget](#46-onboarding-checklist-widget)
  - [4.7 Overview and analytics on the same page](#47-overview-and-analytics-on-the-same-page)
- [5. Listing page pattern](#5-listing-page-pattern)
  - [5.1 Canonical anatomy](#51-canonical-anatomy)
  - [5.2 DataGrid full playbook](#52-datagrid-full-playbook)
  - [5.3 Empty states](#53-empty-states)
  - [5.4 Bulk actions ActionBar](#54-bulk-actions-actionbar)
  - [5.5 Rich cells reference](#55-rich-cells-reference)
  - [5.6 Filters](#56-filters)
  - [5.7 Per-module listing deltas](#57-per-module-listing-deltas)
- [6. Detail / show page pattern](#6-detail--show-page-pattern)
  - [6.1 Canonical anatomy](#61-canonical-anatomy)
  - [6.2 HoverCard usage matrix](#62-hovercard-usage-matrix)
- [7. Create / Edit / Delete pattern](#7-create--edit--delete-pattern)
  - [7.1 FocusModal vs Drawer vs full-page vs Popover](#71-focusmodal-vs-drawer-vs-full-page-vs-popover)
  - [7.2 progress-accordion vs progress-tabs decision tree](#72-progress-accordion-vs-progress-tabs-decision-tree)
  - [7.3 Field library](#73-field-library)
  - [7.4 Danger actions](#74-danger-actions)
  - [7.5 Optimistic UI plus toast plus rollback](#75-optimistic-ui-plus-toast-plus-rollback)
- [8. Attendance UX](#8-attendance-ux)
- [9. Settings module](#9-settings-module)
  - [9.1 Route map](#91-route-map)
  - [9.2 Section catalogue](#92-section-catalogue)
  - [9.3 Full settings JSON schema](#93-full-settings-json-schema)
  - [9.4 Per-section anatomy](#94-per-section-anatomy)
  - [9.5 Scope inheritance model](#95-scope-inheritance-model)
  - [9.6 Danger zone patterns](#96-danger-zone-patterns)
- [10. Analytics and reporting surface](#10-analytics-and-reporting-surface)
- [11. Notifications and real-time](#11-notifications-and-real-time)
- [12. Command palette playbook](#12-command-palette-playbook)
- [13. Accessibility and i18n](#13-accessibility-and-i18n)
- [14. Performance](#14-performance)
- [15. Design tokens](#15-design-tokens)
- [16. Implementation roadmap](#16-implementation-roadmap)
- [17. Open questions](#17-open-questions)
- [18. Appendix A: Component-to-module cross reference](#18-appendix-a-component-to-module-cross-reference)
- [19. Appendix B: Settings module folder layout](#19-appendix-b-settings-module-folder-layout)
- [20. Appendix C: Detailed patterns and expansions](#20-appendix-c-detailed-patterns-and-expansions)

---

## 0. Executive summary

Academorix is the operating system for multi-sport academies. The dashboard is
what a director opens on Monday morning, what a coach loads before a training
session, what reception unlocks on the front desk kiosk, and what finance runs
at month end. The current shell already ships an authenticated `AppLayout` with
a resource-driven primary sidebar, working-scope switchers in the navbar, and a
placeholder overview page that renders four counts against `useList`. This
document upgrades that shell into a production dashboard: a customisable
overview, a canonical listing pattern for every one of the 52 modules, a
detail-page and form pattern that treats destructive verbs with the seriousness
they deserve, a Settings module with a secondary sidebar and typed schema, a
global command palette, and a real-time notification surface. The plan is
deliberately conservative about invention. Where HeroUI Pro ships a component
that fits, that component is the answer. Where the custom `@academorix/ui/react`
package already ships something, we use it. Where nothing fits, the plan lists a
specific open question in Section 17 rather than manufacturing an answer.

The vision is a single dashboard product that works for owners and reception, at
a single branch and across a network, in English and in Arabic, in the browser
and on a coach's tablet. Owners see the whole network at a glance. Coaches see
today's sessions on Agenda. Reception sees a fast-path for check-in that leans
on `pin-lock` and `pattern-lock`. Finance sees invoices, payments, and payroll
grids with `money-amount-cell` in every currency cell. Every listing has KPIs
above it, filters as chips beside it, bulk actions in a floating `ActionBar`
below it, and an empty state that tells the user exactly what to do next. Every
detail page opens with a header, tabs, an activity `Timeline`, and a side rail
of metadata. Every destructive action wears the `PressableFeedback.HoldConfirm`
badge; nothing about deactivating a branch or refunding a payment should feel
like clicking a normal button. Every form that touches more than a handful of
fields uses `FocusModal` from `@academorix/ui/react`, and every form that has
phases uses either `progress-tabs` or `progress-accordion`. The command palette
(`Command` from `@heroui-pro/react`) is the third-most-used control in the app,
after the sidebar and the DataGrid. Settings are a first-class module with a
secondary sidebar, per-key scope (tenant, region, branch, user), and a typed
JSON schema documented in Section 9.3.

The five top-level design principles are:

1. Density first, but never at the cost of legibility. The dashboard is an
   operational tool for people who look at it for hours. Use the compact
   variants of every component (`size="sm"` on `Chip`, `Button`, `DataGrid`,
   `KPI`), `tabular-nums` on every numeric cell, and reserve marketing-scale
   typography for the landing page.
2. One canonical anatomy per surface. Every listing has the same skeleton
   (header, KPI strip, toolbar, chips row, DataGrid, ActionBar, footer). Every
   detail page has the same skeleton (header, tabs, timeline, side rail). Every
   form uses one of four shells (FocusModal, Drawer, full page, Popover) and one
   of two multi-step containers (ProgressTabs, ProgressAccordion). The team
   should not be inventing layout for the eighth listing page.
3. Scope is scoped, always. Every list, every KPI, every widget respects the
   active organisation, region, branch, and season. `ResourceDataGrid` already
   threads scope filters through `useTable`; every new surface follows that
   pattern. When scope changes, all queries invalidate and refetch. This is not
   an optimisation, it is the model.
4. Danger is never one click. Deactivating a branch, deleting an athlete,
   revoking a credential, refunding a payment, purging retention data - every
   irreversible verb uses `PressableFeedback.HoldConfirm` or a `ConfirmDialog`
   with a typed confirmation. This is not paranoia; a coach mid-training with a
   tablet should not be able to remove twelve athletes with a mis-swipe.
5. Bilingual, RTL-native, offline-tolerant. Arabic is a first-class language,
   not a translation pass. Every layout is tested in RTL. Every icon that
   carries directional meaning (chevrons, arrows, sort indicators) uses the
   logical variants HeroUI Pro already exposes. Every mutation writes
   optimistically to a local queue that survives a lost connection;
   `@academorix/ui/react` ships `pin-lock` and `pattern-lock` specifically for
   reception in poor-connectivity conditions.

The migration story is phased. Phase 1 upgrades the overview page to widgets,
KPIs, and the onboarding checklist. Phase 2 rolls the canonical listing template
across every module by way of `ResourceDataGrid`, wiring `KPIGroup`,
`ActionBar`, and `EmptyState` into every list. Phase 3 delivers detail pages,
forms in `FocusModal`, and destructive-verb wrapping. Phase 4 delivers the
Settings module in full and the global `Command` palette. Phase 5 delivers
analytics widgets, saved reports, and real-time notification badges. Section 16
lays this out in a shipable order.

---

## 1. Design principles

### Density

Academorix is not a marketing site. Users spend hours in the dashboard on Monday
afternoon and Friday morning; the surface has to reward familiarity. Every
component sits at its densest usable size by default:

- `DataGrid` uses `size="sm"` and
  `[&_.table__cell]:py-1.5 [&_.table__cell]:text-xs` on grids where rows are
  informational (leads, athletes, invoices). It uses standard sizing on rare
  grids where rows carry decisions (approval tasks, safeguarding incidents).
- `Chip` uses `size="sm" variant="soft"` for status,
  `size="sm" variant="secondary"` for metadata, and
  `size="sm" variant="outline"` for filter chips. The colour is decided by the
  state, not the emphasis.
- `Button` uses `size="sm" variant="secondary"` for the neutral toolbar verbs,
  `size="sm" variant="primary"` for the single page-level primary action, and
  `variant="ghost"` for iconography and row-level actions. `variant="tertiary"`
  is reserved for filter and sort dropdown triggers so they stand apart from
  primary and secondary actions.
- `KPI` uses the two-column `KPI.Content` grid, a single-line title, no icon by
  default, and a trend chip only when the metric has a comparable prior period.
- `Widget` uses `Widget.Header` with a `Widget.Title` at 14 pixels and a
  `Widget.Description` at 12 pixels muted when a subtitle is needed. Widget
  titles are nouns (`Revenue`, `Active athletes`, `Session load`), never full
  sentences.
- Every numeric cell uses `tabular-nums`. Every currency cell uses
  `MoneyAmountCell` from `@academorix/ui/react`. Every percentage uses
  `NumberValue` with `style="percent"` and one fractional digit.

Density is a global default, and it is overridden explicitly. When a page wants
larger touch targets - the reception kiosk, the training-session confirmation
flow on tablet - the module declares its own scale, and the rest of the
dashboard is not affected.

### Motion

Motion is short and cheap. HeroUI Pro components animate in and out inside 100
to 200 milliseconds; the plan does not add layered animations on top of that.
Three rules govern motion:

- Enter and exit animations use the component's default (typically opacity and
  small offset). Do not add custom easing.
- `PressableFeedback.Ripple` is the default press feedback on any pressable
  card, list row, or Card variant that opens a detail page. It is not used on
  `Button`, which already has its own press treatment.
- `PressableFeedback.HoldConfirm` is the default for destructive verbs. Its
  duration prop defaults to 2000 milliseconds. For extremely destructive actions
  (delete an organisation, purge a data-retention window), lengthen it to 4000
  milliseconds. For milder verbs (archive a lead), leave it at the default.

All motion respects `prefers-reduced-motion`. HeroUI Pro's built-in CSS already
handles this. If a module hand-rolls animation (drag-to-reorder in the widget
grid, custom transitions in a full-page onboarding flow), it must guard on the
same media query.

### Accessibility

- Every `DataGrid`, `KPI`, `Widget`, `Command`, `Agenda`, `Kanban`, and
  `ActionBar` gets an `aria-label`. The label is the resource name in the
  tenant's terminology: `useResourceLabel("athletes", "Athletes")`.
- Every button that renders only an icon (`isIconOnly` on `Button`) has an
  `aria-label`.
- Every destructive verb has a confirmation, and the confirmation names the
  record being deleted (`Delete athlete "Sara Al Zahra"`, not
  `Delete this athlete`).
- Every editable cell uses `TextField`, `NumberStepper`, `Switch`, or
  `InlineSelect` (from `@heroui-pro/react`), all of which are keyboard
  accessible by default. Do not build custom inputs.
- The command palette (`Command`) is always reachable by `⌘ K` on macOS and
  `Ctrl K` elsewhere. It closes on `Esc`. It is the fallback for every action
  the sidebar hides.
- Focus rings are the HeroUI Pro default. The `AuthenticatedLayout` shell
  forwards focus correctly across primary sidebar, secondary sidebar (Settings),
  navbar, and content.
- Colour contrast follows the WCAG 2.1 AA baseline as computed against
  `--color-foreground`, `--color-muted`, and `--color-accent` in the HeroUI Pro
  `default` theme. Full WCAG validation requires manual testing with assistive
  technologies and expert accessibility review; the plan does not claim
  automatic compliance.

### i18n and RTL

Every UI string is in `messages/{locale}.json`, and every page-level content
(empty-state descriptions, onboarding copy) is in `public/data/{locale}/*.json`.
English is the default. Arabic is a full translation pass, always in review with
the primary translator, and the layout is always tested with `dir="rtl"` on the
root.

- Icons that encode direction (`ChevronLeftIcon`, `ChevronRightIcon`,
  arrow-based sort indicators) flip via CSS logical properties. HeroUI Pro's
  DataGrid already uses `inset-inline-start` and `inset-inline-end` for pinned
  columns; do not override.
- Numbers use `Intl.NumberFormat` via `NumberValue`. Currency codes come from
  the active branch's `currency` setting (Section 9.3), and the locale comes
  from the active user's `language` setting.
- Dates use `Intl.DateTimeFormat` via HeroUI Pro's calendar components. `Agenda`
  respects the active timezone.
- `MoneyAmountCell` receives the currency code as a prop; do not hard-code
  `"USD"`.
- Nationality flags come from `flagcdn.com` (see the DataGrid pinned-columns
  example above), keyed by ISO-3166-1 alpha-2 codes. The `NationalityCell`
  composite is defined in Section 5.5.

### Responsiveness

The dashboard is designed for desktop (1440 pixels), works well on tablet (1024
pixels), and remains usable on phone (390 pixels). Three breakpoints:

- Desktop (≥ 1280 pixels): primary sidebar is always expanded unless the user
  collapses it; DataGrid uses the full column set; KPIGroup renders horizontally
  with four cards.
- Tablet (≥ 768 pixels): primary sidebar collapses to
  `sidebarCollapsible="icon"`; DataGrid uses `contentClassName="min-w-[720px]"`
  (or module-specific) so it scrolls horizontally rather than truncates.
- Phone (< 768 pixels): primary sidebar hides behind `AppLayout.MenuToggle`;
  DataGrid columns collapse to name plus a single secondary column plus actions;
  KPIGroup wraps vertically; toolbar wraps to two lines.

The reception kiosk is a separate case. It uses `pin-lock` and `pattern-lock` at
a fixed 720 by 1280 portrait; see Section 5.7 for the `reception` module.

### Dark mode

HeroUI Pro's dark mode is enabled by default in the `AuthenticatedLayout`
(through `ThemeSwitcher`). Every custom component in `@academorix/ui/react` must
render in both modes. When a module needs a dark-mode-specific value, it uses
the HeroUI Pro CSS variables (`--color-background`, `--color-surface`,
`--color-foreground`, `--color-muted`, `--color-accent`, `--color-success`,
`--color-warning`, `--color-danger`) rather than hard-coded hex values.
`MoneyAmountCell` and `StatusBadge` already do this; new components follow the
pattern.

### Drag-and-drop rules

The dashboard uses drag-and-drop in five places, and only in those five places:

1. The overview widget grid (Section 4.2).
2. The Kanban board on `leads`, `safeguarding-incidents`, and approval tasks
   (Section 5.7).
3. `DataGrid` row reorder on `formations` positions and `curriculum` stages
   (Section 5.2).
4. `Agenda` drag-to-create, drag-to-move, drag-to-resize (Section 8).
5. File upload zones via `FileUpload` from `@academorix/ui/react` and `DropZone`
   from `@heroui-pro/react`.

Every drag interaction has a keyboard fallback. `DataGrid` reorder supports
Enter to grab, arrow keys to move, Enter to drop. `Kanban` supports the same.
`Agenda` supports arrow keys plus modifier keys to move events across the grid.
HeroUI Pro implements this natively; module authors do not add their own drag
layer.

### Keyboard-first navigation

- `⌘ K` opens the command palette.
- `/` focuses the search field of the active listing.
- `?` opens the keyboard shortcut registry (Section 13.2).
- `⌘ B` toggles the primary sidebar collapse.
- `⌘ Enter` in a `FocusModal` submits the form.
- `Esc` closes the topmost overlay (modal, drawer, command palette, popover).
- `G` then a module key (e.g. `G` `A` for athletes) jumps to a module listing.
- `N` then a module key opens the create flow for that module.
- The full registry is in Section 13.2.

---

## 2. Component inventory

### 2.1 HeroUI Pro components

HeroUI Pro is 64 components across charts, data display, AI, feedback, layout,
forms, navigation, and overlays. The dashboard uses about half of them heavily,
a third occasionally, and the remainder rarely. The table below groups
components by primary dashboard role and names the modules they land in.

| Component                                                                                             | Import                 | Primary role                                        | Primary modules                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DataGrid`                                                                                            | `@academorix/ui/react` | Canonical listing table                             | Every module with a listing (all 52)                                                                                    |
| `ActionBar`                                                                                           | `@academorix/ui/react` | Bulk-action floating toolbar                        | Every listing where selection is enabled                                                                                |
| `KPI`                                                                                                 | `@academorix/ui/react` | Single metric with sparkline and trend              | `dashboard`, `sports/*`, `payments`, `leads`, `reports`                                                                 |
| `KPIGroup`                                                                                            | `@academorix/ui/react` | Horizontal or vertical KPI stack                    | Above every listing DataGrid                                                                                            |
| `Widget`                                                                                              | `@academorix/ui/react` | Header, content, footer, legend shell               | `dashboard`, `reports`, per-module analytics tabs                                                                       |
| `Agenda`                                                                                              | `@academorix/ui/react` | Day, week, month calendar with drag                 | `sports/sessions`, `sports/matches`, `sports/events`, `sports/training`, `facilities` bookings, `coaching` availability |
| `Kanban`                                                                                              | `@academorix/ui/react` | Drag-and-drop board                                 | `leads`, `safeguarding` incidents, `admin` approval tasks                                                               |
| `HoverCard`                                                                                           | `@academorix/ui/react` | Reference-preview popover on hover                  | Every DataGrid cell that references an athlete, coach, staff, team, invoice, lead                                       |
| `Command`                                                                                             | `@academorix/ui/react` | Global command palette                              | Root shell, keyed to `⌘ K`                                                                                              |
| `Sidebar`                                                                                             | `@academorix/ui/react` | Primary + secondary sidebar                         | `AuthenticatedLayout` (primary), `settings` module (secondary)                                                          |
| `AppLayout`                                                                                           | `@academorix/ui/react` | Full app shell                                      | `AuthenticatedLayout`                                                                                                   |
| `Navbar`                                                                                              | `@academorix/ui/react` | Top bar with scope switchers                        | `AuthenticatedLayout`                                                                                                   |
| `EmptyState`                                                                                          | `@academorix/ui/react` | Zero-record placeholder with CTA                    | Every listing when `data.length === 0`                                                                                  |
| `Timeline`                                                                                            | `@academorix/ui/react` | Activity history                                    | Every detail page (`sports/athletes`, `leads`, `safeguarding`, `payments`, `admin` audit log)                           |
| `ItemCard`, `ItemCardGroup`                                                                           | `@academorix/ui/react` | Selectable card list                                | `integrations` catalogue, `passes` catalogue                                                                            |
| `Stepper`                                                                                             | `@academorix/ui/react` | Linear multi-step navigator                         | Onboarding, first-run wizards inside `dashboard` and `sports/registrations`                                             |
| `Segment`                                                                                             | `@academorix/ui/react` | Tabs with segmented styling                         | Agenda view switcher, DataGrid view switcher (All / My / Archived)                                                      |
| `Sheet`                                                                                               | `@academorix/ui/react` | Drawer with header, body, footer                    | Mobile filter drawer, notification center                                                                               |
| `TrendChip`                                                                                           | `@academorix/ui/react` | Trend indicator with arrow                          | Inside `KPI.Trend`, inside per-cell delta chips                                                                         |
| `PressableFeedback`                                                                                   | `@academorix/ui/react` | Ripple / Highlight / HoldConfirm / ProgressFeedback | Destructive verbs, pressable cards                                                                                      |
| `NumberValue`                                                                                         | `@academorix/ui/react` | Locale-aware number formatter                       | Every numeric render outside `MoneyAmountCell`                                                                          |
| `Rating`                                                                                              | `@academorix/ui/react` | Star rating                                         | `sports/performance` scoring, `staff` peer review                                                                       |
| `AreaChart`, `LineChart`, `BarChart`, `PieChart`, `RadarChart`, `RadialChart`, `ComposedChart`        | `@academorix/ui/react` | Widget contents                                     | `dashboard`, `reports`, `sports/performance`, `payments`, `attendance`                                                  |
| `ChartTooltip`                                                                                        | `@academorix/ui/react` | Tooltip renderer for charts                         | Every chart-in-Widget composition                                                                                       |
| `RichTextEditor`                                                                                      | `@academorix/ui/react` | Formatted text input                                | `announcements`, `messaging` templates, `safeguarding` case notes                                                       |
| `NumberStepper`                                                                                       | `@academorix/ui/react` | Stepped number input                                | Session capacity, athlete age, seat count                                                                               |
| `InlineSelect`                                                                                        | `@academorix/ui/react` | Compact dropdown for inline editing                 | Editable cells, page-size dropdown                                                                                      |
| `NativeSelect`                                                                                        | `@academorix/ui/react` | System select on tiny screens                       | Mobile-only forms                                                                                                       |
| `CheckboxButtonGroup`                                                                                 | `@academorix/ui/react` | Card-style multi-select                             | Notification preferences, permission grid, integration toggles                                                          |
| `RadioButtonGroup`                                                                                    | `@academorix/ui/react` | Card-style single-select                            | Plan selection, billing cycle, scope target                                                                             |
| `CellSelect`                                                                                          | `@academorix/ui/react` | Settings-panel styled select                        | Every row in the Settings module                                                                                        |
| `CellSwitch`                                                                                          | `@academorix/ui/react` | Settings-panel styled switch                        | Feature-flag rows, notification toggles                                                                                 |
| `CellSlider`                                                                                          | `@academorix/ui/react` | Settings-panel styled slider                        | Retention days, notification quiet-hours                                                                                |
| `CellColorPicker`                                                                                     | `@academorix/ui/react` | Settings-panel styled colour picker                 | Branding accent, team primary colour                                                                                    |
| `DropZone`                                                                                            | `@academorix/ui/react` | Drag-and-drop file target                           | Bulk import, media upload                                                                                               |
| `FileTree`                                                                                            | `@academorix/ui/react` | Hierarchical tree                                   | Document library, folder navigation in `documents`                                                                      |
| `ListView`                                                                                            | `@academorix/ui/react` | Grouped selectable list                             | Reception check-in queue                                                                                                |
| `PromptInput`, `PromptSuggestion`, `ChatConversation`, `ChatMessage`, `ChatToolbar`, `ChainOfThought` | `@academorix/ui/react` | AI chat surface                                     | `ai` module                                                                                                             |
| `Markdown`, `CodeBlock`, `TextShimmer`                                                                | `@academorix/ui/react` | AI response rendering                               | `ai` module                                                                                                             |
| `Resizable`                                                                                           | `@academorix/ui/react` | Split-pane resizer                                  | `documents` viewer, `integrations` payload inspector                                                                    |
| `ContextMenu`                                                                                         | `@academorix/ui/react` | Right-click menu                                    | DataGrid row context, Kanban card context                                                                               |
| `EmojiPicker`, `EmojiReactionButton`                                                                  | `@academorix/ui/react` | Reactions                                           | `announcements` comments                                                                                                |
| `Rating`                                                                                              | `@academorix/ui/react` | Star rating                                         | Performance scoring                                                                                                     |
| `Carousel`                                                                                            | `@academorix/ui/react` | Horizontal card scroller                            | `passes` gallery, `announcements` featured items                                                                        |
| `FloatingToc`                                                                                         | `@academorix/ui/react` | Long-page table of contents                         | `reports` long-form reports, `documents` article view                                                                   |

### 2.2 HeroUI OSS components

The OSS package ships 71 components. Most are primitives used inside Pro
compositions. The dashboard uses them everywhere: `Button`, `Chip`, `Badge`,
`Avatar`, `Input`, `TextField`, `TextArea`, `SearchField`, `NumberField`,
`Switch`, `Checkbox`, `RadioGroup`, `Select`, `ComboBox`, `Autocomplete`,
`Popover`, `Tooltip`, `Modal`, `Drawer`, `AlertDialog`, `Alert`, `Toast`,
`Skeleton`, `Spinner`, `Meter`, `ProgressBar`, `ProgressCircle`, `Separator`,
`Card`, `Breadcrumbs`, `Kbd`, `Pagination`, `Tabs`, `TagGroup`, `Toolbar`,
`DatePicker`, `DateRangePicker`, `DateField`, `TimeField`, `Calendar`,
`RangeCalendar`, `ScrollShadow`, `Disclosure`, `DisclosureGroup`, `Fieldset`,
`Form`, `Description`, `Label`, `ErrorMessage`, `FieldError`, `InputGroup`,
`InputOTP`, `Link`, `ListBox`, `CloseButton`, `Accordion`, `Surface`,
`Typography`, `Slider`, `ButtonGroup`, `ToggleButton`, `ToggleButtonGroup`,
colour components (`ColorArea`, `ColorField`, `ColorPicker`, `ColorSlider`,
`ColorSwatch`, `ColorSwatchPicker`).

Key OSS usage:

| Component                                                                              | Role in dashboard                                                      |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Button`                                                                               | Every clickable action                                                 |
| `Chip`                                                                                 | Status, filter tokens, count badges                                    |
| `Badge`, `Badge.Anchor`                                                                | Notification dot on the bell, unread count on Sidebar items            |
| `Avatar`, `Avatar.Image`, `Avatar.Fallback`                                            | Athlete / coach / staff cell                                           |
| `Input`, `TextField`, `TextArea`                                                       | Every free-text input                                                  |
| `SearchField`                                                                          | Toolbar search on every listing                                        |
| `NumberField`                                                                          | Every numeric input outside `NumberStepper`                            |
| `Switch`                                                                               | Toggle on Settings rows, feature flags, notification preferences       |
| `Select`, `ComboBox`, `Autocomplete`                                                   | Form dropdowns                                                         |
| `Popover`, `Tooltip`                                                                   | Inline help, action hints                                              |
| `Modal`, `Drawer`, `AlertDialog`                                                       | Simple confirmations and mid-weight forms                              |
| `Alert`                                                                                | Non-blocking inline notice above a section                             |
| `Toast`                                                                                | Ephemeral outcome notice, top-right, 4-second default                  |
| `Skeleton`                                                                             | Loading state for KPI, Widget, DataGrid rows                           |
| `Spinner`                                                                              | Inline loading (KPI card, DataGrid empty state)                        |
| `Meter`, `ProgressBar`, `ProgressCircle`                                               | Capacity indicators, upload progress                                   |
| `Separator`                                                                            | Every visual divider                                                   |
| `Card`, `Card.Header`, `Card.Body`, `Card.Footer`                                      | Widget alternative, detail-page rails                                  |
| `Breadcrumbs`                                                                          | Detail-page header, Settings nested pages                              |
| `Kbd`                                                                                  | Keyboard shortcut hint next to actions                                 |
| `Pagination`                                                                           | DataGrid footer                                                        |
| `Tabs`                                                                                 | Detail-page tabs                                                       |
| `TagGroup`                                                                             | Editable chip list (labels, tags on athletes)                          |
| `Toolbar`                                                                              | Formatting toolbar in RichTextEditor                                   |
| `DatePicker`, `DateRangePicker`, `DateField`, `TimeField`, `Calendar`, `RangeCalendar` | Every date input                                                       |
| `ScrollShadow`                                                                         | Sticky-column overflow indicator                                       |
| `Disclosure`, `DisclosureGroup`, `Accordion`                                           | Collapsible sections in forms, settings, help                          |
| `Fieldset`, `Form`, `Description`, `Label`, `ErrorMessage`, `FieldError`               | Form primitives                                                        |
| `Link`                                                                                 | Text anchor                                                            |
| `ListBox`                                                                              | Menu content inside `Dropdown`, `Select`, `Autocomplete`, `CellSelect` |

### 2.3 `@academorix/ui/react` custom components

Custom components live in `packages/ui/src/react/components/`. There are 13
today. Each one has a specific role that HeroUI Pro does not fill, and each one
is used in a specific set of modules. `@academorix/ui/react` re-exports every
Pro and OSS component in addition to these customs; a single import gives the
caller everything.

| Component                                                                        | Role                                                                                                          | Primary modules                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `FocusModal`, `FocusModal.Header`, `FocusModal.Body`, `FocusModal.Footer`        | Full-screen focus experience for complex forms. Slightly heavier than `Drawer`, more purposeful than `Modal`. | Match creation and edit, invoice creation, curriculum builder, safeguarding case draft |
| `SectionContainer`                                                               | Page-section wrapper with a title, description, and slot for actions.                                         | Every detail page section, every settings section                                      |
| `ProgressTabs`, `ProgressTabsList`, `ProgressTabsTrigger`, `ProgressTabsContent` | Multi-step form as tabs with per-tab status                                                                   | Athlete registration, staff onboarding, team creation                                  |
| `ProgressAccordion`, `ProgressAccordionItem`                                     | Multi-step form as accordion with per-item status                                                             | Invoice creation, curriculum stage editor, competition setup                           |
| `StatusBadge`                                                                    | Canonical status pill in the tenant's semantic palette                                                        | Every listing status column, every detail-page header                                  |
| `MoneyAmountCell`                                                                | Currency-aware cell formatter                                                                                 | Every DataGrid amount column, every KPI monetary value                                 |
| `JsonViewSection`                                                                | Read-only JSON viewer                                                                                         | Advanced settings, webhook payload preview, audit log detail                           |
| `InlineTip`                                                                      | Inline hint text (info, warning, tip, success variants)                                                       | Above sections that need explanatory copy                                              |
| `ConfirmDialog`                                                                  | Wrapper around `AlertDialog` with typed variant, primary and secondary actions                                | Every non-destructive confirmation (leave unsaved changes, cancel wizard)              |
| `FileUpload`, `FileUpload.Preview`                                               | File and media upload widget with drop, click, preview                                                        | Athlete photo, staff photo, invoice attachment, safeguarding evidence                  |
| `PinLock`                                                                        | Numeric PIN entry                                                                                             | Reception kiosk unlock, guardian self-checkin                                          |
| `PatternLock`                                                                    | Android-style pattern lock                                                                                    | Reception kiosk unlock (alternative), tablet-based coach login                         |
| `PhoneInput`, `PhoneInputInfo`, `PhonePickerMode`, `PhoneCountry`                | International phone input with country flag                                                                   | Every phone field (guardian contact, staff phone, lead contact)                        |

### 2.4 Pro vs OSS vs custom

The rule for choosing a component is short and always the same:

1. If `@academorix/ui/react` ships a custom component that solves the problem,
   use it. It exists because HeroUI does not fit exactly. Examples:
   `MoneyAmountCell`, `StatusBadge`, `PhoneInput`, `FocusModal`, `PinLock`.
2. If a HeroUI Pro component solves the problem, use it. Pro components are more
   opinionated and ship the compound API you want. Examples: `DataGrid` (not
   `Table`), `KPI` (not custom Card), `Widget` (not custom container), `Agenda`
   (not custom calendar), `Kanban` (not custom drag-and-drop), `Command` (not
   custom command palette).
3. If a HeroUI OSS primitive solves the problem, use it. OSS is the primitive
   layer under both Pro and custom components. Examples: `Button`, `Chip`,
   `Badge`, `Avatar`, `Popover`, `Tooltip`, every form primitive, every date
   primitive.
4. If none of the above solves the problem, propose a new custom component with
   a short design doc, put it in `packages/ui/src/react/components/`, and add it
   to the barrel export.

The registry re-exports everything through `@academorix/ui/react`, and Pro wins
ties (see `packages/ui/src/react/index.ts`). Module authors always import from
`@academorix/ui/react`, never from `@heroui/react` or `@heroui-pro/react`
directly. This keeps the surface swappable in the future.

---

## 3. Global chrome

The chrome is everything wrapping the routed page. It is app infrastructure, not
feature code, and it lives in
`apps/web/src/components/layout/authenticated-layout.tsx`,
`apps/web/src/components/scope/`, `apps/web/src/components/theme/`, and (once
introduced by this plan) `apps/web/src/components/command/`. Feature modules
never import chrome; they render inside it.

### 3.1 Primary sidebar

The primary sidebar already exists in `authenticated-layout.tsx`. It is
generated from the module registry (`appResources` at `lib/module/registry.ts`),
filtered by the caller's identity (features + permissions), and labelled with
the tenant's terminology. Every module contributes zero or more resources to
this sidebar via `AppResource.meta`.

The existing behaviour is correct; this plan does not tear it down. It adds four
things:

1. Grouping. The sidebar today is flat. With 52 modules, that is unusable. We
   introduce three top-level groups with `Sidebar.Group` from HeroUI Pro:
   - Overview: `dashboard` (only)
   - Operations: everything under `sports/*` (athletes, teams, sessions,
     matches, training, attendance, awards, coaching, competition, development,
     drills, events, formations, medical, performance, progress, registrations,
     registry, seasons), plus `reception`, `attendance`, `announcements`,
     `messaging`, `documents`, `people`, `staff`
   - Growth: `leads`, `memberships`, `passes`, `public-site`, `notifications`,
     `announcements`
   - Finance: `payments`, `billing`, `expenses`, `entitlements`
   - Administration: `access`, `admin`, `attributes`, `branches`, `credentials`,
     `facilities`, `integrations`, `offline-sync`, `organization`, `regions`,
     `safeguarding`, `users`, `workspace`, `reports`
   - AI + Automation: `ai`

   Groups render collapsed by default, expanded on hover of any child, and
   remembered per-user in `localStorage` via `Sidebar.Provider`'s persistence
   hooks.

2. Real-time badges. Any sidebar item with pending work (leads unread,
   safeguarding open, payments overdue) shows a `Badge` inside
   `Sidebar.MenuIcon`. The badge counts are wired through `useList` with
   `pageSize: 1` on a filtered query and refresh on the same cadence as
   notifications (Section 11.3).

3. Terminology. The existing `identity.terminology` map already renames
   `athletes` → `Students` for academies or `Members` for clubs. This survives
   grouping. Groups do not have terminology; item labels do.

4. Order. `AppResourceMeta.order` continues to drive sort within a group. Groups
   themselves are ordered as above and are not per-tenant configurable in this
   phase (Open question, Section 17).

Import path: `import { Sidebar } from "@academorix/ui/react"`. Sidebar sub-parts
used: `Sidebar.Header`, `Sidebar.Content`, `Sidebar.Menu`, `Sidebar.MenuItem`,
`Sidebar.MenuIcon`, `Sidebar.MenuLabel`, `Sidebar.Group`, `Sidebar.GroupHeader`,
`Sidebar.GroupLabel`, `Sidebar.Trigger`.

### 3.2 Secondary sidebar pattern

Some modules have too many pages to sit on the primary sidebar. Settings is the
archetype (see Section 9), and any future module with more than ~8 sub-pages (a
hypothetical `reports` deep dive, a hypothetical `admin` audit console) uses the
same pattern.

The pattern:

- The primary sidebar has a single item pointing at the module root:
  `/settings`, `/reports`, `/admin`.
- The module's routes render a secondary sidebar inside the module layout. The
  secondary sidebar sits between the primary sidebar and the main content,
  exactly like GitHub's repository settings, Linear's workspace settings, or
  Vercel's project settings.
- The secondary sidebar is built with `Sidebar` from `@academorix/ui/react`
  using `Sidebar.Content` and `Sidebar.Group` for nesting. It does not have its
  own header (the primary sidebar owns the workspace/tenant brand).
- The active item in the secondary sidebar is driven by
  `useLocation().pathname`.
- On tablet, the secondary sidebar collapses to a `Segment` or `Tabs` (Open
  question, Section 17: which is the right mobile treatment?).

A canonical secondary-sidebar shell is proposed in Appendix B for the Settings
module and reused whenever a future module needs it.

### 3.3 Top bar

The top bar today (`Navbar` inside `AuthenticatedLayout`) has: mobile menu
toggle, primary sidebar collapse trigger, active section title, three scope
switchers (`OrganizationSwitcher`, `BranchSwitcher`, `SeasonSwitcher`), language
switcher, theme switcher, and user menu.

This plan adds four elements, in this order from left to right in the middle of
the navbar:

1. Global search trigger. A pressable `Button` variant with `variant="ghost"`
   shaped like a search input, with `SearchIcon`, the placeholder
   `Search... ⌘K`, and a `Kbd` on the right showing `⌘K`. Pressing it opens the
   command palette (Section 3.4).
2. Notification bell. `Button isIconOnly variant="ghost"` with a `Badge.Anchor`
   wrapping the `BellIcon`. The badge shows an unread count. Clicking opens the
   notification drawer (Section 3.5).
3. Help. `Button isIconOnly variant="ghost"` with a `QuestionMarkCircleIcon`.
   Opens a `Popover` with links to `/docs`, keyboard shortcuts (`?`), contact
   support, and the changelog.
4. User avatar dropdown. Already present. Extends with a `Chip` inside the
   popover showing the user's current role scope (Owner / Coach / Reception /
   Finance), so the user always knows which permission set is active.

The three scope switchers (Organisation / Branch / Season) are already grouped
inside the navbar. This plan adds one more when the tenant is a region-enabled
network: `RegionSwitcher`. Region sits above Branch in the hierarchy (Section
9.5).

Import path: `import { Navbar } from "@academorix/ui/react"`. Compound API used:
`Navbar.Header`, `Navbar.Spacer`.

### 3.4 Command palette

The command palette is `Command` from `@heroui-pro/react`. It is mounted at the
root of `AuthenticatedLayout`, keyed to `⌘ K` on macOS and `Ctrl K` elsewhere,
and is the fallback for every action the sidebar does not directly expose.

The palette has four command classes, each in its own `Command.Group`:

1. Navigate. Every module gets a `Command.Item` with the label `Go to <label>`
   and an icon matching the sidebar. Selecting the item routes to the module's
   list URL.
2. Create. Every module with a create page gets a `Command.Item` with the label
   `Create <singular label>` and a `Plus` icon.
3. Search records. When the user types into `Command.InputGroup.Input`, the
   palette fires background queries against athletes, coaches, teams, invoices,
   leads, and returns results as `Command.Item`s grouped under `Athletes`,
   `Coaches`, `Teams`, `Invoices`, `Leads`.
4. Actions. Contextual verbs: `Switch to <branch>`, `Switch to <season>`,
   `Sign out`, `Toggle theme`, `Open Settings`, `Open notifications`.

The full command catalogue is in Section 12. The palette respects the active
scope: creating a session from `⌘ K` creates it under the current branch, not
under a global scope.

Import path: `import { Command } from "@academorix/ui/react"`. Compound API
used: `Command.Backdrop`, `Command.Container`, `Command.Dialog`,
`Command.Header`, `Command.InputGroup`, `Command.InputGroup.Prefix`,
`Command.InputGroup.Input`, `Command.InputGroup.ClearButton`,
`Command.InputGroup.Suffix`, `Command.List`, `Command.Group`, `Command.Item`,
`Command.Separator`, `Command.Footer`.

The palette is a global overlay owned by `AuthenticatedLayout`, not by any
module. Modules contribute commands by registering them at load time (see the
implementation note in Section 12).

### 3.5 Notification center pattern

The notification center opens from the bell in the navbar. It is a `Drawer` from
`@heroui/react` anchored to the right side, at the `md` breakpoint or larger; on
phones it is a full-screen `Sheet`.

Anatomy:

- Header: title (`Notifications`), a `Segment` with three tabs (`All`,
  `Mentions`, `System`), and a `Button variant="ghost" size="sm"` labelled
  `Mark all read`.
- Body: a `ListView` from `@heroui-pro/react` with a `ListView.Item` per
  notification. Each item renders an `Avatar` (source), a title, a description,
  a relative timestamp, and a status dot (`Badge` with unread indication).
- Footer: a link to `/notifications` (the full notifications page under the
  `notifications` module).

Notifications come from
`useList({ resource: "notifications", pagination: { pageSize: 20 } })` filtered
by `is_read: false` for the `All` tab and by the tab's specific filter
otherwise. Marking an item read fires a mutation; marking all read fires a bulk
mutation.

Real-time updates use the transport described in Section 11.3.

---

## 4. Overview dashboard page

The overview page at `/dashboard` (rendered by
`apps/web/src/modules/dashboard/pages/dashboard-page.tsx`) is the authenticated
landing surface. Today it renders a static grid of four `Card` components
counting athletes, coaches, events, and teams. This plan replaces it with a
customisable, drag-and-drop widget grid backed by a widget catalogue, an
onboarding checklist widget, a KPI strip, and a saved-layout system.

### 4.1 Layout

The overview page is a vertical stack:

1. Page header. Title (`Dashboard`), subtitle (`An overview of your academy` or
   the tenant's terminology equivalent), and a right-aligned toolbar with three
   controls:
   - `Segment` view switcher: `Overview` (default) and `Analytics`. See Section
     4.7 for the decision to keep them on the same page.
   - `Button variant="secondary" size="sm"` labelled `Customise` opening the
     widget picker (Section 4.3).
   - `Button variant="secondary" size="sm"` labelled `Layouts` opening the
     saved-layouts popover (Section 4.4).

2. Onboarding checklist widget. Visible until the tenant has completed all
   onboarding steps (or until the user manually dismisses it). This is a
   `Widget` from `@academorix/ui/react`. See Section 4.6 for the full step
   catalogue.

3. KPI strip. A `KPIGroup` from `@academorix/ui/react` with four KPI cards using
   `size="sm"` and `KPI.Chart` sparklines. Defaults are:
   - Athletes (tenant terminology).
   - Active memberships.
   - Revenue this month.
   - Sessions this week.

4. Widget grid. The customisable region. A responsive grid of `Widget`
   containers, each addressable by a widget key from the catalogue (Section
   4.5). The default layout places three widgets across at 1280 pixels:
   `Recent activity`, `Upcoming sessions`, `Attendance today`. Widget positions
   and visibility are per-user (Section 4.2 and 4.4).

5. Recent activity Agenda strip. A read-only `Agenda` from
   `@academorix/ui/react` in `week` view, height-constrained to 300 pixels,
   showing sessions, matches, events, and private sessions for the current
   scope. Clicking a slot navigates to the module detail page.

6. Upcoming events strip. A horizontally scrollable list of `Card` components
   with `PressableFeedback.Ripple` on each, showing the next five events across
   matches and events. Selecting a card opens the event detail in a
   `FocusModal`.

### 4.2 Drag-and-drop widget grid

The widget grid is a persisted, drag-and-drop responsive layout. Technical
approach:

- Use `react-grid-layout` (already a common pick in the Vite/React ecosystem,
  MIT-licensed, keyboard accessible with the `isDraggable`/`isResizable`
  toggles). If the team prefers another library, `@dnd-kit/core` composes
  cleanly with HeroUI Pro's own drag primitives; either is acceptable. This plan
  uses `react-grid-layout` as the default because it ships responsive breakpoint
  handling and layout serialisation out of the box.
- Each widget occupies a whole row on phone, half a row on tablet, and one
  column on desktop by default. The user can resize any widget between 1x1 and
  3x2 grid cells.
- Widget positions are persisted in a `dashboard_layouts` resource, one row per
  (user, layout name) tuple:

  ```ts
  export interface DashboardLayout {
    id: string;
    user_id: string;
    name: string; // "Personal" is the default; users can create additional named layouts
    is_default: boolean;
    is_shareable: boolean; // false unless explicitly shared to tenant
    scope: "user" | "role" | "tenant";
    breakpoints: Record<"lg" | "md" | "sm", DashboardLayoutBreakpoint>;
    created_at: string;
    updated_at: string;
  }

  export interface DashboardLayoutBreakpoint {
    columns: number;
    row_height: number;
    items: DashboardLayoutItem[];
  }

  export interface DashboardLayoutItem {
    widget_key: string; // matches the catalogue in Section 4.5
    x: number;
    y: number;
    w: number;
    h: number;
    is_static?: boolean; // reserved for owner-forced widgets
  }
  ```

- Keyboard access. Focus a widget's drag handle (`Tab`), press `Enter` to grab,
  arrow keys to move, `Enter` again to drop. `react-grid-layout` supports this
  natively; we do not customise it beyond wiring keyboard focus indicators to
  the HeroUI Pro focus ring tokens.
- Auto-save. Layout changes save after a 500-millisecond debounce.

### 4.3 Widget picker dialog

The widget picker is a modal opened by the `Customise` button. Component:
`Modal` from `@heroui/react`, size `lg`.

Anatomy:

- Header: `Modal.Header` with a title (`Customise dashboard`), a `SearchField`
  on the right for filtering widgets by name, and a close button.
- Body: `CheckboxButtonGroup` from `@heroui-pro/react` with `layout="grid"` in
  three columns. One `CheckboxButtonGroup.Item` per widget from the catalogue
  (Section 4.5). Each item shows an icon, a title, a one-line description, and a
  small preview image. Toggling an item adds or removes the widget from the
  current layout.
- Footer: `Modal.Footer` with:
  - `Button variant="ghost"` labelled `Reset to default`
  - `Button variant="secondary"` labelled `Cancel`
  - `Button variant="primary"` labelled `Save`

Save mutates the current layout via a mutation against `dashboard_layouts`.
Cancel restores the pre-open layout. Reset overwrites the current layout with
the tenant default.

Widgets are grouped by category using `CheckboxButtonGroup.Item` inside
`Fieldset` blocks:

- Onboarding
- Numbers (KPIs)
- Charts
- Calendar
- People
- Money
- Compliance

Each widget in the catalogue lists a category (Section 4.5).

### 4.4 Saved layouts

Users can save multiple layouts and switch between them. The `Layouts` button
opens a `Popover` from `@heroui/react` with:

- A `ListBox` from `@heroui/react` listing the user's own layouts.
- Below that, a `Separator` and a section labelled `Presets` listing
  tenant-shared layouts (see below).
- A `Button variant="secondary" size="sm"` labelled `New layout` that copies the
  current layout into a new named entry.
- A `Button variant="ghost" size="sm"` labelled `Manage` that opens a modal
  listing all layouts with rename, delete, and share controls.

Default layouts. Every tenant ships with three role-scoped presets so users can
pick a good starting point:

- Owner view. KPIs across the full network, Revenue this month, Active branches,
  Coach utilisation, Recent safeguarding cases, Recent leads.
- Coach view. Today's sessions, This week's training load, My athletes, Recent
  progress notes, Upcoming assessments.
- Reception view. Today's check-ins, Guardians on premises, Waiting list, Recent
  registrations, Facility bookings.

Presets are stored in `dashboard_layouts` with `scope: "tenant"` and
`is_shareable: true`. Users cannot delete them; they can copy them into a
personal layout (`scope: "user"`) and modify freely.

Layout share. A user with the right permission can promote a personal layout to
a shareable preset by opening `Manage` and toggling `Share to tenant`. The
layout then appears in every user's `Presets` section. Sharing does not force
adoption; each user picks whether to apply it.

### 4.5 Full widget catalogue

Widgets are the atomic unit of the overview page. Each widget is a `Widget` from
`@academorix/ui/react` wrapping either a `KPI`, a chart from
`@academorix/ui/react`, a `DataGrid` (small, header-less), or a specialised
composition (Onboarding checklist, Recent activity Agenda strip).

Every widget listed below is available in the picker unless flagged otherwise.
The catalogue is populated as data:

| Widget key                         | Title                          | Source resource                                        | Renderer                                         | Permission                               | i18n key                                        |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------- |
| `onboarding-checklist`             | Setup checklist                | `dashboard_onboarding_state`                           | `OnboardingChecklistWidget` (custom, see 4.6)    | Any                                      | `dashboard.onboarding.title`                    |
| `kpi-athletes`                     | Athletes count                 | `athletes`                                             | `Widget` + `KPI`                                 | `athletes.viewAny`                       | `dashboard.widgets.athletes.title`              |
| `kpi-coaches`                      | Coaches count                  | `coaches`                                              | `Widget` + `KPI`                                 | `staff.viewAny`                          | `dashboard.widgets.coaches.title`               |
| `kpi-teams`                        | Teams count                    | `teams`                                                | `Widget` + `KPI`                                 | `teams.viewAny`                          | `dashboard.widgets.teams.title`                 |
| `kpi-active-memberships`           | Active memberships             | `memberships` filtered by `status = active`            | `Widget` + `KPI`                                 | `memberships.viewAny`                    | `dashboard.widgets.memberships.title`           |
| `kpi-revenue-mtd`                  | Revenue MTD                    | `payments` filtered by `paid_at` current month         | `Widget` + `KPI` (MoneyAmountCell in value slot) | `payments.viewAny`                       | `dashboard.widgets.revenue-mtd.title`           |
| `kpi-revenue-ytd`                  | Revenue YTD                    | `payments` filtered by year                            | `Widget` + `KPI`                                 | `payments.viewAny`                       | `dashboard.widgets.revenue-ytd.title`           |
| `kpi-arpa`                         | ARPA (avg revenue per athlete) | `payments` + `athletes`                                | `Widget` + `KPI`                                 | `payments.viewAny`                       | `dashboard.widgets.arpa.title`                  |
| `kpi-attendance-rate-week`         | Attendance rate (7 days)       | `attendance`                                           | `Widget` + `KPI` (percent)                       | `attendance.viewAny`                     | `dashboard.widgets.attendance-rate.title`       |
| `kpi-attendance-rate-month`        | Attendance rate (30 days)      | `attendance`                                           | `Widget` + `KPI` (percent)                       | `attendance.viewAny`                     | `dashboard.widgets.attendance-rate.title`       |
| `kpi-open-leads`                   | Open leads                     | `leads` filtered by stage `!= "won"` and `!= "lost"`   | `Widget` + `KPI`                                 | `leads.viewAny`                          | `dashboard.widgets.leads.title`                 |
| `kpi-conversion-rate`              | Lead conversion rate           | `leads`                                                | `Widget` + `KPI` (percent)                       | `leads.viewAny`                          | `dashboard.widgets.conversion.title`            |
| `kpi-safeguarding-open`            | Open safeguarding cases        | `safeguarding` filtered by status                      | `Widget` + `KPI` (danger tint if > 0)            | `safeguarding.viewAny`                   | `dashboard.widgets.safeguarding.title`          |
| `kpi-overdue-invoices`             | Overdue invoices               | `payments` filtered by `status = overdue`              | `Widget` + `KPI` (danger)                        | `payments.viewAny`                       | `dashboard.widgets.overdue.title`               |
| `kpi-active-branches`              | Active branches                | `branches` filtered by `status = active`               | `Widget` + `KPI`                                 | `branches.viewAny`                       | `dashboard.widgets.branches.title`              |
| `chart-revenue-90d`                | Revenue trend (90 days)        | `payments` aggregated by day                           | `Widget` + `AreaChart`                           | `payments.viewAny`                       | `dashboard.widgets.revenue-chart.title`         |
| `chart-registrations-30d`          | Registrations (30 days)        | `sports/registrations`                                 | `Widget` + `BarChart`                            | `registrations.viewAny`                  | `dashboard.widgets.registrations-chart.title`   |
| `chart-attendance-30d`             | Attendance (30 days)           | `attendance`                                           | `Widget` + `LineChart`                           | `attendance.viewAny`                     | `dashboard.widgets.attendance-chart.title`      |
| `chart-lead-sources`               | Lead sources                   | `leads` grouped by source                              | `Widget` + `PieChart`                            | `leads.viewAny`                          | `dashboard.widgets.lead-sources.title`          |
| `chart-coach-utilisation`          | Coach utilisation              | `sports/coaching` + `sports/sessions`                  | `Widget` + `RadialChart`                         | `coaching.viewAny`                       | `dashboard.widgets.coach-utilisation.title`     |
| `chart-revenue-per-sport`          | Revenue per sport              | `payments` + `sports/registrations` grouped by sport   | `Widget` + `BarChart`                            | `payments.viewAny`                       | `dashboard.widgets.revenue-per-sport.title`     |
| `chart-membership-retention`       | Membership retention           | `memberships` cohort analysis                          | `Widget` + `LineChart`                           | `memberships.viewAny`                    | `dashboard.widgets.retention.title`             |
| `agenda-today`                     | Today's schedule               | `sports/sessions` + `sports/matches` + `sports/events` | `Widget` + `Agenda day`                          | `sessions.viewAny`                       | `dashboard.widgets.today-agenda.title`          |
| `agenda-week`                      | This week                      | Same as above                                          | `Widget` + `Agenda week`                         | `sessions.viewAny`                       | `dashboard.widgets.week-agenda.title`           |
| `list-recent-registrations`        | Recent registrations           | `sports/registrations` last 7 days                     | `Widget` + `DataGrid` mini                       | `registrations.viewAny`                  | `dashboard.widgets.recent-registrations.title`  |
| `list-recent-payments`             | Recent payments                | `payments` last 7 days                                 | `Widget` + `DataGrid` mini (MoneyAmountCell)     | `payments.viewAny`                       | `dashboard.widgets.recent-payments.title`       |
| `list-recent-athletes`             | New athletes                   | `sports/athletes` last 30 days                         | `Widget` + `DataGrid` mini                       | `athletes.viewAny`                       | `dashboard.widgets.new-athletes.title`          |
| `list-attendance-warnings`         | Attendance warnings            | `attendance` where athlete missed 3+ sessions          | `Widget` + `DataGrid` mini                       | `attendance.viewAny`                     | `dashboard.widgets.attendance-warnings.title`   |
| `list-open-safeguarding`           | Open safeguarding cases        | `safeguarding` filtered by open status                 | `Widget` + `DataGrid` mini                       | `safeguarding.viewAny`                   | `dashboard.widgets.open-safeguarding.title`     |
| `list-approvals-queue`             | Approvals queue                | `admin/approvals` where status is pending              | `Widget` + `DataGrid` mini                       | `admin.approve`                          | `dashboard.widgets.approvals.title`             |
| `list-upcoming-events`             | Upcoming events                | `sports/events` next 30 days                           | `Widget` + `DataGrid` mini                       | `events.viewAny`                         | `dashboard.widgets.events.title`                |
| `list-lead-pipeline`               | Lead pipeline                  | `leads` grouped by stage                               | `Widget` + mini Kanban                           | `leads.viewAny`                          | `dashboard.widgets.lead-pipeline.title`         |
| `people-birthdays`                 | Birthdays this week            | `sports/athletes` + `staff` filtered by DoB month      | `Widget` + `ListView`                            | `athletes.viewAny`                       | `dashboard.widgets.birthdays.title`             |
| `people-recent-check-ins`          | Recent check-ins               | `reception` last 24 hours                              | `Widget` + `ListView`                            | `reception.viewAny`                      | `dashboard.widgets.checkins.title`              |
| `people-guardians-on-premises`     | Guardians on premises          | `reception` filtered by presence                       | `Widget` + `ListView`                            | `reception.viewAny`                      | `dashboard.widgets.guardians-on-premises.title` |
| `finance-outstanding-balance`      | Outstanding balance            | `payments` sum of unpaid                               | `Widget` + `KPI` (MoneyAmountCell)               | `payments.viewAny`                       | `dashboard.widgets.outstanding.title`           |
| `finance-forecast`                 | Cash flow forecast (30 days)   | `payments` scheduled + expected                        | `Widget` + `ComposedChart`                       | `payments.viewAny` + `payments.forecast` | `dashboard.widgets.cash-forecast.title`         |
| `finance-refunds-mtd`              | Refunds this month             | `payments` filtered by `status = refunded`             | `Widget` + `KPI` (danger)                        | `payments.viewAny`                       | `dashboard.widgets.refunds.title`               |
| `compliance-credentials-expiring`  | Credentials expiring           | `credentials` where `expires_at` within 60 days        | `Widget` + `DataGrid` mini                       | `credentials.viewAny`                    | `dashboard.widgets.credentials-expiring.title`  |
| `compliance-documents-missing`     | Documents missing              | `documents` where required missing                     | `Widget` + `DataGrid` mini                       | `documents.viewAny`                      | `dashboard.widgets.documents-missing.title`     |
| `compliance-safeguarding-training` | Safeguarding training          | `staff` filtered by training status                    | `Widget` + `KPI` (percent)                       | `staff.viewAny`                          | `dashboard.widgets.safeguarding-training.title` |
| `ai-quick-actions`                 | AI quick actions               | AI-generated                                           | `Widget` + `PromptSuggestion` list               | `ai.use`                                 | `dashboard.widgets.ai-quick-actions.title`      |

The catalogue is data, stored in
`apps/web/src/modules/dashboard/widgets.catalogue.ts`. Adding a widget is a new
entry plus a renderer file (`apps/web/src/modules/dashboard/widgets/<key>.tsx`).
Feature modules can also register widgets from their own module manifest via
`AppModule.dashboardWidgets?` (Open question, Section 17: should widget
definitions live centrally in the dashboard module or federated to each feature
module?).

### 4.6 Onboarding checklist widget

The onboarding checklist is a special widget. It is not chosen from the
catalogue; it appears automatically when the tenant has any incomplete step and
disappears once every step is complete or dismissed. Users can also collapse it
manually via a chevron in the widget header.

Component composition:

- `Widget` from `@academorix/ui/react` as the outer shell.
- `Widget.Header` with title `Get started`, description
  `Complete these steps to launch your academy`, and a right-aligned `Chip`
  showing `{completed} / {total}` and a `ProgressBar` filled by
  `{completed / total}`.
- `Widget.Content` with a vertical list of steps built from `Disclosure` and
  `DisclosureGroup` from `@heroui/react`. Each step is a `Disclosure` with:
  - Trigger: `Disclosure.Trigger` rendering a check icon (checked or unchecked),
    the step title, and a `Chip` (`variant="soft" color="success"`) reading
    `Complete` when done.
  - Panel: `Disclosure.Panel` rendering the step description, a `Button` for the
    primary action, and an optional `Button variant="ghost"` labelled
    `Dismiss this step` if the user wants to skip it.
- `Widget.Footer` with a `Button variant="ghost" size="sm"` labelled
  `Hide checklist` that sets `dashboard_onboarding_state.hidden = true`.

Step catalogue. The dashboard ships with 12 default steps, plus 3 conditional
steps that only appear for certain tenant types:

1. Set up your workspace. Route: `/workspace`. Completion: `workspace.name` and
   `workspace.timezone` are set. Icon: `BuildingOfficeIcon`.
2. Add your first branch. Route: `/branches/create`. Completion: at least one
   row in `branches`. Icon: `MapPinIcon`.
3. Configure your domain. Route: `/settings/general`. Completion:
   `settings.tenant.custom_domain` is set. Icon: `GlobeAltIcon`.
4. Invite your first coach. Route: `/staff/invite`. Completion: at least one row
   in `staff` with `role = coach`. Icon: `UserGroupIcon`.
5. Enable payments. Route: `/settings/billing`. Completion:
   `settings.tenant.payments.provider` is set. Icon: `CreditCardIcon`.
6. Add your sports catalogue. Route: `/settings/sports`. Completion: at least
   one row in `sports_catalogue`. Icon: `TrophyIcon`.
7. Create your first team. Route: `/teams/create`. Completion: at least one row
   in `teams`. Icon: `UsersIcon`.
8. Register your first athlete. Route: `/athletes/create`. Completion: at least
   one row in `sports/athletes`. Icon: `AcademicCapIcon`.
9. Schedule your first session. Route: `/sessions/create`. Completion: at least
   one row in `sports/sessions` in the future. Icon: `CalendarIcon`.
10. Set up notifications. Route: `/settings/notifications`. Completion: at least
    one channel is enabled and one preference is not default. Icon: `BellIcon`.
11. Configure safeguarding. Route: `/settings/safeguarding`. Completion:
    `settings.tenant.safeguarding.policy_url` is set. Icon: `ShieldCheckIcon`.
12. Explore reports. Route: `/reports`. Completion: user has visited the reports
    index at least once. Icon: `ChartBarIcon`.

Conditional steps:

- Enable Arabic. Only if the tenant is in a bilingual region (Section 9.5).
  Route: `/settings/languages`. Completion: `settings.tenant.enabled_locales`
  includes `ar`.
- Set up reception. Only if the tenant has more than one branch. Route:
  `/reception`. Completion: at least one reception PIN is configured.
- Connect an integration. Only if the tenant has the `integrations` feature key.
  Route: `/integrations`. Completion: at least one active integration.

Completion detection. Each step declares a `completion` predicate that runs on
the client using `useList` with `pageSize: 1` and reads `result.total`. This
mirrors the current KPI pattern in `dashboard-page.tsx`. The full onboarding
state (progress, dismissed steps, hidden flag) lives in a
`dashboard_onboarding_state` resource, one row per tenant. Users cannot dismiss
the tenant-level state, only their personal `hidden` flag on the widget.

Empty tenant. On a brand new workspace, all steps are incomplete and every
step's primary CTA is visible. The checklist widget occupies a full-width row at
the top of the overview.

### 4.7 Overview and analytics on the same page

Recommendation: keep analytics on the overview page, gated by a `Segment` at the
top with `Overview` and `Analytics`. Do not split them into separate routes.

Reasoning:

- The overview page already loads the KPI strip, so it already loads the
  aggregation that analytics widgets need. Two routes duplicate data-fetch,
  cache-invalidation, and scope-switch code paths.
- Users who want deep analytics can navigate to `/reports`, which is a separate
  module with saved reports, scheduled exports, and long-form report pages.
  `/dashboard` is a landing surface; analytics widgets on the overview are the
  fast preview, and `/reports` is where users go to dig in.
- The `Segment` view switcher lets a user drop into an analytics-heavy dashboard
  without leaving `/dashboard`; the state is stored in `?view=analytics` on the
  query string so it persists on refresh and can be linked.

Analytics view. When the user selects `Analytics`, the widget grid re-renders
with a preset selection weighted toward `chart-*` widgets: revenue trend,
registrations bar chart, attendance line chart, membership retention, revenue
per sport, coach utilisation. KPIs stay above the grid but shrink to two cards
(Revenue MTD, Active memberships). The onboarding checklist hides in analytics
view.

Open question: whether the analytics view should be a separate saved layout
(`Analytics preset`) or a hard-coded second view. Section 17.

---

## 5. Listing page pattern

Every one of the 52 modules that has a listing follows the same template. The
template is codified inside
`apps/web/src/components/refine/resource-data-grid.tsx` (already exists) and
extended by this plan to include a KPI strip, an ActionBar for bulk operations,
a toolbar with filter chips, an empty state, and a footer pagination. Modules
provide columns, KPI definitions, bulk verbs, filter chips, and empty-state
copy. Everything else is shared.

### 5.1 Canonical anatomy

Top to bottom on a listing page:

1. Page header row.
   - Left: title (tenant terminology) and a `Chip variant="soft"` showing the
     total row count. Example: `Athletes` with a chip reading `1,248`.
   - Right: primary action `Button variant="primary" size="sm"` labelled
     `Add athlete` or the module's equivalent verb (e.g. `Invite coach`,
     `New match`, `Create invoice`). Secondary actions live behind a `Dropdown`
     triggered by `Button variant="ghost" size="sm" isIconOnly` with an
     `EllipsisVerticalIcon`.

2. KPI strip. A `KPIGroup` from `@academorix/ui/react` with three or four `KPI`
   cards. Each module declares its KPI selection (Section 5.7). Values use
   `useList` with a filter and read `result.total`, or a purpose-built aggregate
   endpoint when available.

3. Toolbar. Left to right:
   - `SearchField` from `@heroui/react` bound to the module's search fields
     (name, email, phone).
   - Filter dropdown(s) from `@heroui/react` `Dropdown`. Each dropdown maps to a
     filter dimension (status, source, sport, branch when the user has
     cross-branch permissions).
   - Sort dropdown. A `Dropdown` mapping to a column list, driving the
     DataGrid's `sortDescriptor`.
   - Column visibility. A `Dropdown` with `selectionMode="multiple"` for column
     IDs.
   - Optional view switcher. A `Segment` when the listing supports Agenda or
     Kanban alternatives (see Section 5.7).
   - Right-most: `Button variant="ghost" size="sm"` labelled `Export CSV`
     triggering a client-side or server-side CSV download.

4. Filter chips row. When any filter is active, render a horizontal row of
   `Chip variant="secondary" size="sm"` with an inline close button. A trailing
   `Button variant="ghost" size="sm"` labelled `Clear all` resets every filter.

5. DataGrid. `DataGrid` from `@academorix/ui/react` with `variant="primary"`,
   `showSelectionCheckboxes`, `allowsColumnResize`,
   `contentClassName="min-w-[<module>]"`, virtualization on lists that regularly
   exceed 200 rows.

6. ActionBar. `ActionBar` from `@academorix/ui/react` at the bottom of the
   viewport, appearing when `selectedKeys` is non-empty. Verbs are
   module-specific (Section 5.4).

7. Footer pagination. Existing pattern in `ResourceDataGrid`. Show the range
   (`X to Y of Z`), a `Pagination` with previous, page numbers with ellipsis,
   next, and an `InlineSelect` with rows-per-page options (10, 25, 50, 100).

### 5.2 DataGrid full playbook

The listing-page DataGrid is the single most important surface in the dashboard.
This subsection is the definitive prop-by-prop guide. It assumes the current
`ResourceDataGrid` component as the base and extends it.

Column definitions live in the module. Example shape from the current leads
listing:

```ts
const columns: DataGridColumn<Lead>[] = [
  {
    id: "name",
    header: "Lead",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 200,
    pinned: "start",
    cell: (lead) => (
      <HoverCard>
        <HoverCard.Trigger>
          <span className="font-medium">{lead.name}</span>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <LeadHoverCard lead={lead} />
        </HoverCard.Content>
      </HoverCard>
    ),
  },
  { id: "stage", header: "Stage", allowsSorting: true, cell: (l) => <LeadStageChip stage={l.stage} /> },
  { id: "source", header: "Source", allowsSorting: true, cell: (l) => l.source },
  { id: "sport_key", header: "Sport", cell: (l) => l.sport_key ?? "-" },
  {
    id: "owner_id",
    header: "Owner",
    minWidth: 160,
    cell: (l) => (l.owner_id ? <OwnerCell id={l.owner_id} /> : "-"),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 120,
    pinned: "end",
    cell: (l) => <RowActions lead={l} />,
  },
];
```

Prop-by-prop guidance for `DataGrid`:

- `aria-label`: required. Use the module label in the tenant's terminology:
  `useResourceLabel("athletes", "Athletes")`.
- `columns`: required. See above. `id` is the sort field.
- `data`: rows from `useTable`.
- `getRowId`: `(item) => String(item.id)`. Always string; keeps `Selection`
  typed consistently.
- `variant`: `"primary"` on the main listing. `"secondary"` on mini-DataGrids
  inside widgets (see 4.5).
- `contentClassName`: `"min-w-[720px]"` at minimum. Modules with more columns
  increase this; see 5.7 for per-module recommendations.
- `scrollContainerClassName`: leave off unless the DataGrid needs its own scroll
  container (e.g. inside a `Widget.Content` with a fixed height, use
  `"max-h-[400px] overflow-y-auto"`).
- `verticalAlign`: default `"middle"`. Set `"top"` on listings with multi-line
  cells (safeguarding cases with a description on the first cell).
- `showSelectionCheckboxes`: `true` on every listing that supports bulk actions.
  `false` on read-only listings (audit log).
- `selectionMode`: `"multiple"` for bulk actions, `"single"` for
  selection-into-detail patterns, `"none"` otherwise.
- `selectedKeys`, `onSelectionChange`: bind to a component-level state
  `useState<Selection>(new Set())`.
- `sortDescriptor`, `onSortChange`: bridged through `ResourceDataGrid` to
  Refine's `sorters`.
- `allowsColumnResize`: `true` on primary listings; `false` on mini-DataGrids.
- `onColumnResizeEnd`: persist widths to a per-user `dashboard_column_widths`
  keyed by (user, resource).
- `renderEmptyState`: required. Use HeroUI Pro `EmptyState` with contextual copy
  (Section 5.3).
- `virtualized`: `true` on listings that regularly exceed 200 rows. Requires
  `rowHeight` and `headingHeight`. See Section 14.1 for the threshold.
- `rowHeight`: `48` for standard density, `58` when rows carry avatars, `72`
  when rows carry avatars plus a description.
- `headingHeight`: `37`.
- `getChildren`: only for listings that display hierarchical data. `formations`
  positions, `curriculum` stages, `documents` folder tree.
- `treeColumn`: the column ID that renders the expand chevron. Defaults to the
  first `isRowHeader`.
- `expandedKeys`, `onExpandedChange`: control expansion in the listing state.
- `onLoadMore`, `isLoadingMore`, `loadMoreContent`: use `onLoadMore` on lists
  where infinite scroll is preferred over pagination (`ai` chat history,
  `messaging` inbox). Otherwise stick with pagination.
- `onReorder`: enable on `formations` positions, `curriculum` stages, and on
  `dashboard_layouts` items in the manage dialog. Do not enable on
  general-purpose listings; row reorder implies a manual sort field that most
  modules do not have.

Bridge to Refine's `useTable`. The existing `ResourceDataGrid` already
implements:

- Single-column sort bridge (`sorters` ↔ `SortDescriptor`).
- Scope-aware permanent filters via `buildScopeFilters(scope, meta.scopedBy)`.
- Pagination footer.

Extensions this plan adds to `ResourceDataGrid`:

- `kpi` prop: a `ReactNode` rendered above the grid, expected to be a
  `KPIGroup`.
- `toolbar` prop: a `ReactNode` rendered above the grid, below the KPI strip.
  Modules pass a `<ListingToolbar>` composite.
- `bulkActions` prop: an array of `{ id, label, icon, onAction, variant? }`. The
  bridge renders an `ActionBar` internally.
- `emptyState` prop: overrides the built-in message with a full `EmptyState`
  node.
- `viewMode` prop: `"grid" | "kanban" | "agenda"`, driving whether to render the
  DataGrid, a Kanban, or an Agenda. Attendance, leads, and matches use this.
- `filterChips` prop: an array of currently-active filters rendered as `Chip`
  with close buttons.
- `savedViews` prop: optional; if provided, renders a Segment-based view
  switcher (Section 5.6).

### 5.3 Empty states

Every listing has a bespoke empty state. Component: `EmptyState` from
`@academorix/ui/react`.

The pattern:

```tsx
<EmptyState size="md">
  <EmptyState.Header>
    <EmptyState.Media variant="icon">
      <ModuleIcon />
    </EmptyState.Media>
    <EmptyState.Title>{title}</EmptyState.Title>
    <EmptyState.Description>{description}</EmptyState.Description>
  </EmptyState.Header>
  <EmptyState.Content>
    <Button variant="primary">{primaryCta}</Button>
    {secondaryCta ? <Button variant="secondary">{secondaryCta}</Button> : null}
  </EmptyState.Content>
</EmptyState>
```

Per-module copy (English defaults):

| Module                 | Title                       | Description                                                                          | Primary CTA         |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------ | ------------------- |
| `sports/athletes`      | No athletes yet             | Register your first athlete to start tracking attendance, performance, and payments. | Register athlete    |
| `sports/coaches`       | No coaches yet              | Add your coaching staff so you can assign them to teams and sessions.                | Add coach           |
| `sports/teams`         | No teams yet                | Create a team to group athletes and assign coaches.                                  | Create team         |
| `sports/sessions`      | No sessions scheduled       | Schedule your first session to open bookings and attendance.                         | Schedule session    |
| `sports/matches`       | No matches on record        | Record your first match to track scores, statistics, and roster.                     | Record match        |
| `sports/events`        | No events planned           | Plan your first event to open registrations.                                         | Plan event          |
| `sports/training`      | No training programmes      | Design a training programme to structure your seasons.                               | Design programme    |
| `sports/attendance`    | No attendance records       | Attendance records appear here once a session runs.                                  | Schedule session    |
| `sports/registrations` | No registrations yet        | Registrations appear here as leads convert or athletes sign up.                      | Open registrations  |
| `sports/performance`   | No performance data         | Track your first assessment to unlock performance analytics.                         | New assessment      |
| `sports/awards`        | No awards recorded          | Log your first award to celebrate athlete milestones.                                | Log award           |
| `sports/medical`       | No medical records          | Medical records appear here once you upload them.                                    | Upload record       |
| `sports/formations`    | No formations               | Design a formation to plan your matches.                                             | Design formation    |
| `sports/drills`        | No drills                   | Add a drill to build your training library.                                          | Add drill           |
| `sports/progress`      | No progress notes           | Progress notes appear as coaches log them.                                           | Add progress note   |
| `sports/coaching`      | No coaching plans           | Publish your first coaching plan.                                                    | Create plan         |
| `sports/competition`   | No competitions             | Create a competition to schedule fixtures.                                           | Create competition  |
| `sports/development`   | No development pathways     | Design a development pathway to guide athletes.                                      | Design pathway      |
| `sports/registry`      | No sports catalogue         | Add a sport to configure age groups, formats, and pricing.                           | Add sport           |
| `sports/seasons`       | No seasons                  | Create a season to time-bound your operations.                                       | Create season       |
| `leads`                | No leads in the pipeline    | Add a lead or import from CSV to start building your pipeline.                       | Add lead            |
| `memberships`          | No memberships              | Create a membership plan to sell recurring access.                                   | Create plan         |
| `passes`               | No passes                   | Design a pass to sell day, week, or session bundles.                                 | Design pass         |
| `payments`             | No payments recorded        | Payments appear here once invoices are issued.                                       | Create invoice      |
| `billing`              | No billing profiles         | Add a billing profile to bill families and organisations.                            | Add profile         |
| `expenses`             | No expenses                 | Record an expense to track outgoings.                                                | Record expense      |
| `entitlements`         | No entitlements             | Entitlements are added when memberships are issued.                                  | Open memberships    |
| `announcements`        | No announcements            | Send an announcement to reach athletes, guardians, or staff.                         | Send announcement   |
| `messaging`            | No conversations            | Start a conversation with an athlete or guardian.                                    | Start conversation  |
| `notifications`        | No notifications            | Nothing to catch up on right now.                                                    | -                   |
| `documents`            | No documents                | Upload a document to share it with athletes, guardians, or staff.                    | Upload document     |
| `people`               | No people                   | Invite a person to your workspace.                                                   | Invite person       |
| `staff`                | No staff                    | Invite a staff member.                                                               | Invite staff        |
| `users`                | No users                    | Invite a user.                                                                       | Invite user         |
| `access`               | No access rules             | Define an access rule to gate a resource.                                            | Define rule         |
| `admin`                | No admin tasks              | Admin approvals appear here as they are raised.                                      | Open approvals      |
| `attributes`           | No custom attributes        | Define a custom attribute to extend records.                                         | Define attribute    |
| `branches`             | No branches                 | Add a branch to expand your academy.                                                 | Add branch          |
| `credentials`          | No credentials              | Add a credential to track coach or staff qualifications.                             | Add credential      |
| `facilities`           | No facilities               | Add a facility to enable booking.                                                    | Add facility        |
| `integrations`         | No integrations             | Connect an integration to sync data with another system.                             | Browse integrations |
| `offline-sync`         | Everything is in sync       | Offline changes appear here while a connection is unavailable.                       | -                   |
| `organization`         | No organisation profile     | Fill in your organisation details.                                                   | Complete profile    |
| `public-site`          | No public site set up       | Design your public site to enable self-serve registration.                           | Open designer       |
| `reception`            | Reception is not configured | Configure reception PINs and workflows.                                              | Configure reception |
| `regions`              | No regions                  | Add a region to group branches.                                                      | Add region          |
| `reports`              | No saved reports            | Save your first report or explore the library.                                       | Explore reports     |
| `safeguarding`         | No safeguarding cases       | Log a case if an incident occurs.                                                    | Log case            |
| `workspace`            | No workspaces               | Create a workspace to onboard your academy.                                          | Create workspace    |

### 5.4 Bulk actions ActionBar

`ActionBar` is anchored to the bottom of the viewport by default. It appears
when `selectionCount > 0`, closes when `selectionCount === 0`, and is
dismissable via `X` in the suffix. Each module declares a bulk-verb list. The
bridge renders `ActionBar.Prefix` with a `Chip` count and `ActionBar.Content`
with a `Button` per verb.

Standard verbs available on every listing:

- Edit. Opens the multi-record edit sheet (a `FocusModal` with a form that lists
  changes to apply to every selected row). Only fields that are safely
  mass-editable appear.
- Export. Client-side CSV export of the selected rows.
- Archive. Soft-delete via a status change on the resource.
- Delete. Hard delete. Danger verb - the button uses
  `PressableFeedback.HoldConfirm`.

Per-module bulk verbs (deltas beyond the standard four):

- `sports/athletes`: Assign to team, Move to branch, Send invitation, Log
  medical clearance.
- `sports/coaches`: Assign to team, Send credential reminder, Suspend,
  Reactivate.
- `sports/teams`: Assign coach, Move to season, Merge teams (with a follow-up
  confirmation).
- `sports/sessions`: Duplicate to next week, Cancel, Reassign coach, Change
  capacity.
- `sports/matches`: Publish scores, Unpublish, Reassign referee.
- `sports/events`: Publish, Unpublish, Open registration, Close registration.
- `sports/attendance`: Mark present, Mark absent, Mark late, Excuse.
- `sports/registrations`: Approve, Reject, Convert to membership, Assign to
  team.
- `sports/performance`: Publish scores, Reset scores, Export report.
- `sports/medical`: Mark cleared, Mark on hold.
- `sports/awards`: Publish, Unpublish.
- `sports/formations`: Duplicate, Assign to team.
- `sports/drills`: Add to plan, Assign to session.
- `leads`: Assign owner, Change stage, Convert to registration, Send follow-up.
- `memberships`: Renew, Suspend, Reactivate, Refund.
- `passes`: Publish, Retire, Duplicate.
- `payments`: Mark paid, Send reminder, Refund, Void.
- `billing`: Send statement, Adjust balance.
- `expenses`: Approve, Reject, Reimburse.
- `entitlements`: Extend, Revoke.
- `announcements`: Publish, Unpublish, Schedule, Send now.
- `messaging`: Assign to staff, Close conversation.
- `documents`: Publish, Retire, Move folder.
- `people`, `staff`, `users`: Invite, Suspend, Reactivate, Change role.
- `access`: Enable, Disable.
- `admin/approvals`: Approve, Reject.
- `attributes`: Publish, Retire.
- `branches`: Activate, Deactivate, Rename.
- `credentials`: Approve, Renew, Revoke, Send reminder.
- `facilities`: Publish, Retire, Add resource.
- `integrations`: Enable, Disable, Reconnect.
- `reception`: Reset PIN, Suspend session.
- `regions`: Activate, Deactivate.
- `reports`: Duplicate, Share, Retire.
- `safeguarding`: Assign case owner, Change status, Escalate.
- `workspace`: Rename, Transfer ownership.

Every verb that is irreversible (`Delete`, `Merge`, `Refund`, `Revoke`,
`Deactivate`) uses `PressableFeedback.HoldConfirm` on the button. The action
fires on `onComplete`. See Section 7.4.

### 5.5 Rich cells reference

Cells are where the dashboard's density earns its keep. Below is the standard
cell library, one entry per canonical cell type. Composites live in
`apps/web/src/components/refine/cells/` and are shared across modules.

- Avatar cell. `Avatar` from `@heroui/react` with `Avatar.Image` and
  `Avatar.Fallback`. Size `sm` by default. Wrap in a `HoverCard` for previews.

  ```tsx
  <HoverCard>
    <HoverCard.Trigger>
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <Avatar.Image alt={athlete.name} src={athlete.avatar_url} />
          <Avatar.Fallback>{initials(athlete.name)}</Avatar.Fallback>
        </Avatar>
        <span className="text-sm font-medium">{athlete.name}</span>
      </div>
    </HoverCard.Trigger>
    <HoverCard.Content>
      <AthleteHoverCard athlete={athlete} />
    </HoverCard.Content>
  </HoverCard>
  ```

- Avatar-group cell. For rosters. `Avatar` with `-space-x-2`
  overflow-negative-margin, plus a `+N` avatar fallback for the tail.

- Nationality flag cell.
  `<NationalityCell code={athlete.nationality} label={athlete.nationality_name} />`.
  Wraps a 20-pixel-wide `img` from `flagcdn.com` and the name.

- Status badge cell. `StatusBadge` from `@academorix/ui/react`. Every status
  column across every module. Colors follow the canonical status palette (see
  Section 15).

  ```tsx
  <StatusBadge color="success">Active</StatusBadge>
  <StatusBadge color="warning">Pending</StatusBadge>
  <StatusBadge color="danger">Expired</StatusBadge>
  <StatusBadge color="accent">Trial</StatusBadge>
  ```

- Money-amount cell. `MoneyAmountCell` from `@academorix/ui/react`. Always pass
  `amount`, `currency`, and (optionally) `locale`. Currency defaults from the
  active branch. Right-aligned column.

- Sparkline cell. `AreaChart` with 90-pixel width, no axes, gradient fill. See
  the servers example in the DataGrid docs. Wrap in a fixed-width `div` with a
  horizontal mask for edge fade.

- ProgressCircle cell. `ProgressCircle` from `@heroui/react` for capacity,
  retention, completion. Colour follows the value.

- Trend chip cell. `TrendChip` from `@academorix/ui/react` next to a number. Use
  inside `KPI.Trend` on widgets and inline in DataGrid cells for
  period-over-period metrics.

- Progress bar cell. `ProgressBar` from `@heroui/react`, thin, inside a
  fixed-width cell for `attendance rate`, `retention`, `medical clearance`.

- Kbd chip. `Kbd` from `@heroui/react` for row-level shortcut hints (rarely in
  listings, but common in `admin/audit`).

- Actions cell. `Dropdown` from `@heroui/react` with
  `Button variant="ghost" size="sm" isIconOnly` trigger and an
  `EllipsisVerticalIcon`. Menu items: `View`, `Edit`, `Duplicate`, per-verb, and
  a `Delete` at the bottom with `Dropdown.Item variant="danger"`.

Column pinning conventions:

- Pin the row-header column (usually `name`) to `"start"`.
- Pin the actions column (`id: "actions"`) to `"end"` with `width: 56`.
- Every listing uses `contentClassName="min-w-[<total column widths>]"` so
  horizontal scroll works between the two pinned columns.

### 5.6 Filters

Filters render as chips. Each active filter appears as a
`Chip variant="secondary" size="sm"` with a label prefix (`Stage: Qualified`,
`Sport: Football`, `Owner: Ali Hassan`) and a `CloseButton` from `@heroui/react`
for removal. A trailing `Clear all` button clears every filter.

Filters propagate to `useTable` through the existing scope-filter mechanism,
extended with a per-module `filters` state that composes with `permanent`
filters:

```ts
const { setFilters } = useTable<T>({ ... });
setFilters([
  { field: "stage", operator: "eq", value: "qualified" },
  { field: "sport_key", operator: "eq", value: "football" },
]);
```

Saved views. Every module supports named saved views: a persisted combination of
filters, sort, and column visibility. Saved views appear in a `Segment` above
the toolbar when the user has at least one view saved. The segment has:

- `All`. No filters.
- Every saved view, ordered by `updated_at desc`.
- A trailing `Segment.Item` for `+ New view`.

Saved views live in a `resource_views` resource keyed by (user, resource, name).
Marking a view as shared to tenant makes it appear for every user on that
resource.

### 5.7 Per-module listing deltas

Below, one paragraph per module. Each paragraph names the KPIs above the
DataGrid, the notable cells, the notable bulk verbs, and any recommendation to
swap DataGrid for Kanban or Agenda. Modules that appear more than once are
listed under their canonical folder.

`access`. KPIs: total rules, enabled rules, rules recently changed. Notable
cells: rule name (with `HoverCard` previewing the rule payload), scope chip
(`branch`, `tenant`), status. Notable bulk verbs: enable, disable, clone.
DataGrid is the right primary. `JsonViewSection` renders the rule payload in the
detail page.

`admin`. This module hosts approval workflows and the audit log. Listing is a
Kanban board of approval tasks (columns: `Open`, `In review`, `Approved`,
`Rejected`), plus a DataGrid tab for the audit log. KPIs above the board: open
approvals, approvals overdue, mean time to approval. Notable cells on the audit
log: actor avatar, action verb, resource link (HoverCard preview), timestamp.
Bulk verbs on approvals: approve, reject, reassign.

`ai`. Listing is a conversation history using `ListView` from
`@heroui-pro/react` (not DataGrid). KPIs: total conversations, tokens used this
month, average response time. Bulk verbs: archive, share to team. Detail page is
a full `ChatConversation` from `@academorix/ui/react`.

`announcements`. KPIs: total announcements, drafts, scheduled, published in last
30 days. Notable cells: title (HoverCard with body preview), audience chips
(`Athletes`, `Guardians`, `Staff`), delivery status, open rate (percent),
publish timestamp. Bulk verbs: publish, unpublish, schedule, duplicate. DataGrid
is the right primary; a `Kanban` view is available for the editorial workflow
(columns: `Draft`, `In review`, `Scheduled`, `Published`, `Archived`).

`attributes`. KPIs: total custom attributes, in use, unused. Notable cells:
attribute name, type chip (`text`, `number`, `select`, `date`), scope chip,
used-in count (a linked count of records). Bulk verbs: publish, retire,
duplicate. DataGrid.

`auth`. No listing (this module owns login/registration/2FA flows). It is not in
the sidebar.

`billing`. KPIs: total billing profiles, outstanding balance, mean days to pay,
this-month collections. Notable cells: profile name (HoverCard with default
payment method preview), balance (`MoneyAmountCell` in danger colour when > 0),
payment method chip (`Card`, `Bank`, `Wallet`), last payment date. Bulk verbs:
send statement, adjust balance, suspend billing. DataGrid.

`branches`. KPIs: total branches, active, coming soon, geographies. Notable
cells: branch name, city (with `NationalityCell` for the country flag), status,
athletes count (mini progress bar to capacity), coach count. Bulk verbs:
activate, deactivate, rename. Detail page includes a mini KPI strip specific to
that branch.

`credentials`. KPIs: total credentials, expiring in 30 days (danger), expired
(danger), pending approval. Notable cells: credential name, holder avatar
(`HoverCard` to athlete or coach), issued-on date, expires-on date, status. Bulk
verbs: approve, renew, revoke, send reminder. DataGrid.

`dashboard`. This module owns the overview page; it does not have a listing.

`documents`. KPIs: total documents, published, drafts, missing required. Listing
is a `DataGrid` with `getChildren` enabled so it renders folders and files
hierarchically. Notable cells: name (with folder or file icon), owner avatar,
version chip, last-updated timestamp. Bulk verbs: publish, retire, move folder.
Alternative view: a `FileTree` from `@heroui-pro/react` in a resizable side
panel.

`entitlements`. KPIs: total entitlements, expiring, expired. Notable cells:
entitlement name, athlete avatar (HoverCard), issued-at, expires-at, status.
Bulk verbs: extend, revoke. DataGrid.

`expenses`. KPIs: total expenses this month, pending approval, approved,
reimbursed. Notable cells: description (HoverCard with receipt preview), amount
(`MoneyAmountCell`), category chip, submitter avatar, status. Bulk verbs:
approve, reject, reimburse. DataGrid.

`facilities`. KPIs: total facilities, available, in use, under maintenance.
Notable cells: facility name, type chip (`pitch`, `pool`, `court`, `gym`),
capacity progress bar, next booking time. Bulk verbs: publish, retire. A
parallel `Agenda` view shows facility bookings across the week (Section 8).

`integrations`. KPIs: connected integrations, available integrations, connection
errors. Listing is an `ItemCardGroup` from `@heroui-pro/react` (not DataGrid)
presenting available integrations as catalogue tiles. Connected integrations sit
in a `DataGrid` beneath. Bulk verbs on the DataGrid: enable, disable, reconnect.
Detail page includes a `JsonViewSection` for the last webhook payload.

`leads`. KPIs: total leads, new this week, in pipeline, converted this month,
conversion rate. Notable cells: lead avatar or initials, name, stage chip
(`Stage` from `LeadStageChip`), source, sport, owner avatar. Bulk verbs: assign
owner, change stage, convert, send follow-up. Recommend: primary view is
`Kanban` (columns: `New`, `Qualified`, `Meeting`, `Won`, `Lost`). Provide a
`DataGrid` alternate view for batch operations and export.

`memberships`. KPIs: total memberships, active, in trial, canceled, MRR
(`MoneyAmountCell`). Notable cells: member avatar, plan chip, status, price
(`MoneyAmountCell`), starts-at, ends-at. Bulk verbs: renew, suspend, reactivate,
refund. DataGrid.

`messaging`. KPIs: total conversations, unread, average response time, this-week
volume. Listing is a two-pane layout: a `ListView` of conversations on the left
(not DataGrid), a `ChatConversation` on the right. Bulk verbs on the ListView
selection: assign to staff, close. Alternative view: DataGrid for reporting.

`notifications`. KPIs: unread, high-priority open, resolved this week. Listing
is `ListView` (not DataGrid). Bulk verbs: mark read, dismiss. The
`notifications` module also owns the notification-center drawer described in
Section 3.5.

`offline-sync`. KPIs: pending mutations, sync status, last sync timestamp.
Listing is a DataGrid of pending mutations. Notable cells: verb chip, target
resource, target ID, submitted-at, retry count. Bulk verbs: retry, discard.

`organization`. KPIs are not applicable; this is a settings-shaped page. It
renders inside `SectionContainer` blocks with `CellSelect`, `Switch`, and
`RichTextEditor` for the tenant profile. No DataGrid.

`passes`. KPIs: total passes, active, expiring, revenue. Notable cells: pass
name, price (`MoneyAmountCell`), sessions remaining (progress bar), holder
avatar, expires-at. Bulk verbs: publish, retire, duplicate. DataGrid.

`payments`. KPIs: this-month collections, outstanding, overdue (danger),
refunds. Notable cells: invoice ID (mono), payer avatar, amount
(`MoneyAmountCell`), status chip, due date, paid date. Bulk verbs: mark paid,
send reminder, refund, void. DataGrid.

`people`. KPIs: total people, active, invited. Notable cells: avatar, name, role
chip, email, phone (via `PhoneInput` shape), status. Bulk verbs: invite,
suspend, reactivate, change role. DataGrid.

`public-site`. Not a listing. This module renders a designer with `Resizable`
panes showing configuration on the left and a preview on the right. Bulk verbs
are not applicable.

`reception`. KPIs: today's check-ins, guardians on premises, waiting list.
Listing is a `ListView` of active check-ins with `PinLock` and `PatternLock`
unlock flows for the kiosk. Bulk verbs on the queue: check in, check out, mark
waiting. A DataGrid alternate view exists for reporting.

`regions`. KPIs: total regions, active, branches per region. Notable cells:
region name, currency chip, language chip, branch count. Bulk verbs: activate,
deactivate. DataGrid.

`reports`. Listing is a DataGrid of saved reports plus an `ItemCardGroup` of
report templates above it. KPIs above the DataGrid: total reports, scheduled,
shared. Bulk verbs on saved reports: duplicate, share, retire. Detail page is a
long-form report with `FloatingToc` from `@heroui-pro/react`.

`safeguarding`. KPIs: open cases, high-severity, resolved this month, mean time
to resolution. Listing is a `Kanban` (columns: `Reported`, `Investigating`,
`Escalated`, `Resolved`). Bulk verbs: assign case owner, change status,
escalate. A DataGrid alternate view exists for reporting.

`staff`. KPIs: total staff, active, on leave, training compliance percent.
Notable cells: avatar, name, role chip, credentials status (`ProgressCircle` for
percent complete), branch chip, phone. Bulk verbs: invite, suspend, reactivate,
change role. DataGrid.

`users`. KPIs: total users, active, invited, unassigned. Notable cells: avatar,
name, role chip, last-login. Bulk verbs: invite, suspend, reactivate, change
role. DataGrid.

`workspace`. Not a listing. Owns workspace creation, switching, and
provisioning.

Sports sub-modules:

`sports/athletes`. KPIs: total athletes, active, on trial, average tenure.
Notable cells: avatar, name, DoB or age, nationality (`NationalityCell`),
primary team chip, current status. Bulk verbs: assign to team, move to branch,
send invitation, log medical clearance. DataGrid; a mini `Agenda` in the detail
page shows the athlete's upcoming sessions.

`sports/attendance`. Recommend `Agenda` as the primary view, DataGrid as an
alternate `Batch review` view. See Section 8.

`sports/awards`. KPIs: total awards, this year, by team. Notable cells:
recipient avatar, award name, ceremony date, evidence attachment. Bulk verbs:
publish, unpublish. DataGrid.

`sports/coaching`. KPIs: total coaches, availability this week, sessions this
month. Notable cells: coach avatar, name, sports covered (`TagGroup`),
availability progress bar. Bulk verbs: assign to team, change availability.
Optional `Agenda` view for availability.

`sports/competition`. KPIs: total competitions, active, upcoming. Notable cells:
competition name, format chip, next fixture, teams count. Bulk verbs: publish,
retire, seed brackets. DataGrid.

`sports/development`. KPIs: total pathways, athletes on pathway, milestones this
month. Notable cells: pathway name, athletes count, average progress
(`ProgressBar`). Bulk verbs: publish, retire. DataGrid.

`sports/drills`. KPIs: total drills, by category, most-used this week. Notable
cells: drill name, category chip, average duration, difficulty chip. Bulk verbs:
publish, retire, duplicate, add to plan. DataGrid.

`sports/events`. Recommend Agenda as primary. Notable cells in the DataGrid
alternate: event name, type chip, start-at, registered count (`ProgressBar` to
capacity). Bulk verbs: publish, open registration, close registration.

`sports/formations`. KPIs: total formations, by sport, most-used this season.
Notable cells: formation name, sport chip, positions count. Bulk verbs:
duplicate, assign to team. `DataGrid` with `getChildren` for positions.

`sports/matches`. Recommend Agenda as primary. Notable cells in the DataGrid
alternate: home team, away team, score, kickoff-at, status. Bulk verbs: publish
scores, unpublish, reassign referee.

`sports/medical`. KPIs: total records, cleared, on hold, expiring. Notable
cells: athlete avatar, record type chip, clearance status, next review date.
Bulk verbs: mark cleared, mark on hold. DataGrid.

`sports/performance`. KPIs: total assessments, this month, average score by
discipline. Notable cells: athlete avatar, assessment type, score (`Rating` for
star ratings, `NumberValue` for numerics), coach avatar, assessed-at. Bulk
verbs: publish, reset, export report. DataGrid.

`sports/progress`. KPIs: total progress notes, this week, by coach. Notable
cells: athlete avatar, coach avatar, note excerpt (HoverCard preview),
created-at. Bulk verbs: archive, export. DataGrid.

`sports/registrations`. KPIs: total registrations, pending approval, approved
this month, revenue (`MoneyAmountCell`). Notable cells: athlete avatar, sport
chip, program chip, status, amount (`MoneyAmountCell`), submitted-at. Bulk
verbs: approve, reject, convert to membership, assign to team. DataGrid.

`sports/registry`. KPIs: total sports, by category, active. Notable cells: sport
name, category chip, athletes enrolled, active teams. Bulk verbs: publish,
retire. DataGrid.

`sports/seasons`. KPIs: current season, upcoming, closed. Notable cells: season
name, sport chip, start-at, end-at, status. Bulk verbs: publish, close,
duplicate. DataGrid.

`sports/sessions`. Recommend Agenda as primary. DataGrid alternate for
reporting. See Section 8.

`sports/teams`. KPIs: total teams, active, average roster size, coach coverage.
Notable cells: team name, sport chip, coach avatar-group, roster count
(`ProgressBar` to capacity), status. Bulk verbs: assign coach, move to season,
merge teams. DataGrid.

`sports/training`. KPIs: total programmes, active, this-week sessions. Notable
cells: programme name, sport chip, weeks, sessions per week, coach avatar. Bulk
verbs: publish, archive, duplicate. DataGrid.

---

## 6. Detail / show page pattern

A detail page is where a user drills into a single record. It follows a
canonical anatomy that mirrors the listing pattern, so users learn one skeleton
and can navigate any module. The current detail pages (for example
`apps/web/src/modules/leads/pages/show.tsx`) will migrate onto this template.

### 6.1 Canonical anatomy

Top to bottom:

1. Breadcrumbs row. `Breadcrumbs` from `@heroui/react`. The last crumb is the
   record's display name (athlete name, invoice number, match title). Every
   intermediate crumb is a link.

2. Header. A flex row with:
   - Left: `Avatar` (or module glyph) at `size="lg"`, a heading (`h1` at 24
     pixels), a subtitle (muted 13-pixel description with contextual metadata
     like `Registered 12 Mar 2024, U-16 boys, primary sport football`).
   - Right: primary action `Button variant="primary"` (context-dependent -
     `Message`, `Record payment`, `Log attendance`), a secondary action
     `Button variant="secondary"` (`Edit`, `Duplicate`, `Export`), and an
     `Dropdown` with an ellipsis trigger holding overflow verbs.

3. Status strip. A row of `Chip` or `StatusBadge` presenting canonical status,
   and secondary chips for scope (`Branch`, `Season`, `Team`). This row is
   sticky under the header for pages that scroll long.

4. Tabs. `Tabs` from `@heroui/react`. Default tab is `Overview`. Additional tabs
   are module-specific:
   - `sports/athletes`: `Overview`, `Attendance`, `Performance`, `Medical`,
     `Payments`, `Documents`, `Activity`.
   - `sports/teams`: `Overview`, `Roster`, `Sessions`, `Matches`, `Formations`,
     `Performance`, `Activity`.
   - `sports/matches`: `Overview`, `Roster`, `Formations`, `Events` (goals,
     cards), `Stats`, `Media`, `Activity`.
   - `leads`: `Overview`, `Timeline`, `Notes`, `Files`, `Activity`.
   - `payments`: `Overview`, `Line items`, `History`, `Related`.
   - `safeguarding`: `Overview`, `Timeline`, `Interviews`, `Evidence`,
     `Actions`, `Activity`.

5. Overview tab body. A two-column layout at desktop (`lg:grid-cols-3` with main
   content spanning two columns and a side rail on the third):
   - Main column: a stack of `SectionContainer` blocks. Each `SectionContainer`
     has a title, description, and content. Typical sections for an athlete:
     `Profile`, `Emergency contact`, `Medical summary`, `Sports & teams`,
     `Documents`.
   - Side rail: a stack of `Card` components with tight metadata: `Quick facts`
     (age, DoB, guardian, coach), `Recent activity` (a compact `Timeline`),
     `Attachments` (a small file list). At tablet, the side rail collapses under
     the main content.

6. Activity Timeline. Every detail page has a `Timeline` from
   `@academorix/ui/react`, either as the last section of the Overview tab or as
   its own tab. The Timeline is `density="compact" size="sm"` and shows
   creation, edits, state changes, comments, and mutations. Icons match the
   event type. Statuses use the canonical palette. Grouping by day is optional
   and controlled per-module.

7. Related-records tables. On the Overview tab, related records render as small
   `DataGrid` composites inside `Widget` blocks. Example for an athlete:
   `Recent sessions` (10 rows max, columns: session name, date, attendance
   chip), `Recent payments` (columns: invoice, amount `MoneyAmountCell`, status,
   date). Each Widget has a footer link (`View all`) that navigates to the
   filtered listing.

### 6.2 HoverCard usage matrix

`HoverCard` previews the record without leaving the current page. Rule: wherever
the dashboard shows a reference to a record (a foreign key), wrap it in a
`HoverCard`. The hover card renders a compact preview with the record's avatar,
name, key attributes, and a `View` link that navigates to the full detail page.

| Reference source                 | Referenced entity | Preview contents                                                                 |
| -------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| Any cell displaying an athlete   | Athlete           | Avatar, name, DoB, primary team, primary sport, current status. Two-column `dl`. |
| Any cell displaying a coach      | Coach             | Avatar, name, role, sports covered, availability chip.                           |
| Any cell displaying staff        | Staff             | Avatar, name, role, branch.                                                      |
| Any cell displaying a team       | Team              | Sport chip, coach avatar, roster count, next match date.                         |
| Any cell displaying an invoice   | Invoice           | Invoice ID, amount `MoneyAmountCell`, status, due date.                          |
| Any cell displaying a lead       | Lead              | Avatar, name, stage chip, source, owner avatar.                                  |
| Any cell displaying a facility   | Facility          | Facility name, type chip, capacity, next booking.                                |
| Any cell displaying a credential | Credential        | Credential name, holder avatar, status, expires-at.                              |
| Any cell displaying a branch     | Branch            | Branch name, city, athletes count, status.                                       |
| Any cell displaying a season     | Season            | Season name, sport chip, start-at, end-at.                                       |

HoverCard uses the HeroUI Pro defaults (700-millisecond open delay,
300-millisecond close delay). On mobile, `HoverCard` degrades to a tap-to-open
`Popover`.

---

## 7. Create / Edit / Delete pattern

Every mutation in the dashboard follows one of four shells: `FocusModal`,
`Drawer`, full-page form, or `Popover`. The choice is driven by the number of
fields, the emotional weight of the action, and whether the flow spans multiple
steps.

### 7.1 FocusModal vs Drawer vs full-page vs Popover

The decision tree is deterministic:

- Popover. 1 to 3 fields, single-step, non-destructive. Example: renaming a
  team, changing a status, assigning an owner. Component: `Popover` from
  `@heroui/react` triggered from an inline `Button variant="ghost"` or an
  actions dropdown.

- Drawer. 4 to 10 fields, single-step, might overlay a listing without losing
  context. Example: creating a lead, adding a training drill, uploading a
  document. Component: `Drawer` from `@heroui/react`, anchored right, size `md`.

- FocusModal. 10 or more fields, multi-step, or complex records (match creation
  with rosters and events; invoice creation with line items; curriculum stages).
  Component: `FocusModal` from `@academorix/ui/react`, which renders full-screen
  (with a subtle max-width) to let users focus on the record.

- Full-page form. Rare, reserved for onboarding, credential renewal, and
  safeguarding case intake - flows that need distance from the rest of the app.
  Component: a routed page. The primary sidebar can be hidden with `AppLayout`'s
  `hideSidebar` flag (Open question, Section 17: does HeroUI Pro's AppLayout
  expose a hide flag today?).

Rule of thumb: if a form fits comfortably in a Drawer at 480 pixels wide with
`size="md"`, use a Drawer. If it needs its own layout with tabs or accordions,
use a FocusModal.

### 7.2 progress-accordion vs progress-tabs decision tree

Multi-step forms use one of two containers, both custom:

- `progress-tabs`. Fixed number of steps (3 to 6), each step small enough to fit
  without scrolling. Users can jump between steps freely. Example: athlete
  registration (`Personal`, `Guardian`, `Sports`, `Documents`, `Review`), staff
  onboarding.

- `progress-accordion`. Variable number of steps, some steps long, sequential
  dependency between steps (step 3 must be completed before step 4 is
  meaningful). Users typically progress linearly but can revisit earlier
  accordions. Example: invoice creation (`Header`, `Line items`, `Discounts`,
  `Taxes`, `Send`), curriculum stage editor.

Decision:

1. Does the form have more than 6 steps? Use `progress-accordion`.
2. Does any step require scrolling in a Drawer or FocusModal? Use
   `progress-accordion`.
3. Do steps have dependencies that make lateral navigation confusing? Use
   `progress-accordion`.
4. Otherwise, use `progress-tabs`.

Both containers share the same status API (`ProgressStatus` and
`AccordionSectionStatus`): `not-started`, `in-progress`, `complete`, `error`.
The container shows a per-step chip with the status and disables the primary
submit until every required step is `complete`.

### 7.3 Field library

The field library is the union of HeroUI OSS form primitives, HeroUI Pro form
components, and `@academorix/ui/react` customs. All fields render inside
`Fieldset` and `Label` from `@heroui/react` with `Description` for helper text
and `ErrorMessage` for validation.

Text. `TextField` and `Input` from `@heroui/react` with `variant="secondary"`.
`TextArea` for multi-line.

Number. `NumberField` from `@heroui/react` for free numbers. `NumberStepper`
from `@heroui-pro/react` for bounded quantities (session capacity, seats,
points).

Currency (input). Compose `NumberField` with `variant="secondary"` and a prefix
chip showing the currency code. For read-only display in cells, use
`MoneyAmountCell` from `@academorix/ui/react`. For display inside `KPI.Value`,
use `NumberValue` with `style="currency"` and the branch currency.

Percentage. `NumberField` with a `%` suffix. Read-only display uses
`NumberValue` with `style="percent"` and `maximumFractionDigits={1}`.

Select. `Select` from `@heroui/react` for small option lists (< 20). `ComboBox`
from `@heroui/react` for larger lists with search. `Autocomplete` from
`@heroui/react` for async lookups (find athlete by name).

Multi-select. `TagGroup` from `@heroui/react` for editable chip lists. For
opinionated card-style multi-select (permissions, integrations), use
`CheckboxButtonGroup` from `@heroui-pro/react`.

Radio. `RadioGroup` from `@heroui/react`. For card-style radios (plan pickers),
use `RadioButtonGroup` from `@heroui-pro/react`.

Switch. `Switch` from `@heroui/react` for boolean toggles.

Date. `DatePicker`, `DateRangePicker`, and `DateField` from `@heroui/react`.
Time-only fields use `TimeField`.

Phone. `PhoneInput` from `@academorix/ui/react`. Every phone input in every
module. The component supports international dialling codes, country flag, and
validates on blur.

File upload. `FileUpload` from `@academorix/ui/react` for the primary
composition (drop, click, preview). Use `DropZone` from `@heroui-pro/react` for
larger drop-target areas (bulk import).

Advanced JSON. `JsonViewSection` from `@academorix/ui/react` for read-only
payload display. For editable JSON (rare - API keys, webhook payloads,
feature-flag settings), pair `JsonViewSection` with a plain `TextArea` for text
edits and validate on save.

Kiosk auth. `PinLock` and `PatternLock` from `@academorix/ui/react`. Used in the
reception module for kiosk unlock and guardian self-checkin.

Colour. `ColorPicker` from `@heroui/react` for branding accent, team primary
colour. For inline settings rows, use `CellColorPicker` from
`@heroui-pro/react`.

Rich text. `RichTextEditor` from `@heroui-pro/react` for announcement bodies,
messaging templates, safeguarding case notes.

### 7.4 Danger actions

Every irreversible verb wears the same badge: `PressableFeedback.HoldConfirm`
from `@heroui-pro/react`. The user must hold the button for at least 2000
milliseconds (default) or 4000 milliseconds (for tenant-scale actions) before
the action fires.

Example (delete an athlete):

```tsx
<Button variant="danger-soft">
  <PressableFeedback.HoldConfirm
    className="bg-danger text-danger-foreground"
    duration={2000}
    onComplete={handleDelete}
  >
    <TrashIcon />
    Deleting {athlete.name}
  </PressableFeedback.HoldConfirm>
  <TrashIcon />
  Delete athlete
</Button>
```

Complementary pattern: `ConfirmDialog` from `@academorix/ui/react`. Use it for
medium-danger verbs where the user should see consequences before committing
(`Refund $250 to Sara Al Zahra`, `Deactivate branch "Riyadh Central"`,
`Revoke credential for Coach Ali`). `ConfirmDialog` presents:

- Title: verb phrased with the target's name.
- Description: two sentences on what happens and what is reversible.
- Optional typed confirmation: a `TextField` labelled `Type the name to confirm`
  for irreversible tenant-scale actions.
- Primary action: `Button variant="danger"` with `PressableFeedback.HoldConfirm`
  for very destructive verbs, or a normal `Button variant="danger"` for
  reversible ones.
- Secondary action: `Button variant="ghost"` labelled `Cancel`.

Tenant-scale actions always require both a typed confirmation and a
`HoldConfirm` press. Examples: delete an organisation, purge a retention window,
cancel a subscription that ends the workspace.

### 7.5 Optimistic UI plus toast plus rollback

Every mutation is optimistic. The pattern:

1. On the client, immediately update the cached list, detail, or KPI value via
   Refine's `useUpdate`, `useCreate`, `useDelete` with
   `mutationMode: "optimistic"` or `"pessimistic"` depending on the verb.
2. Fire a `Toast` from `@heroui/react`. The toast has a two-line body (title and
   description), a `Kbd` chip showing the shortcut to undo if applicable, and a
   `Button variant="ghost"` labelled `Undo` for 6 seconds.
3. If the server rejects the mutation, roll back the cache, dismiss the success
   toast, and show an error toast with the server message and a `Retry` button.

Toast conventions:

- Placement: top-right on desktop, bottom on mobile.
- Duration: 4 seconds for success, 8 seconds for error, indefinite for
  undo-eligible actions.
- Title: past-tense verb (`Athlete created`, `Invoice sent`,
  `Payment refunded`).
- Description: one line naming the target.

Long-running mutations (bulk imports, PDF exports) do not toast on completion.
They fire a notification through the notification center (Section 3.5) and
update a per-user activity log.

---

## 8. Attendance UX

Recommendation: the `sports/attendance` listing renders `Agenda` from
`@academorix/ui/react` by default, with a `DataGrid` alternate view named
`Batch review` accessible from the toolbar's `Segment` view switcher.

Rationale. Attendance is a temporal concept. Coaches want to see today's
sessions, tick athletes in as they arrive, and move on. Product owners want a
`Batch review` table for corrections, exports, and reporting. A single-view
DataGrid does not serve coaches; a single-view Agenda does not serve reporting.
The plan gives coaches Agenda by default and product owners the DataGrid
alternate.

### Agenda view

Layout:

- Above the Agenda: a `KPIGroup` with three KPIs - `Sessions today`,
  `Attendance rate today`, `Absentees today`.
- Agenda: `Agenda` with `defaultView="day"`, `startHour=6`, `endHour=22`,
  `slotDuration=15`. Users can switch between day, week, and month using
  `Agenda.ViewSelector`.
- Each session appears as an `Agenda.Event` with a colour derived from the sport
  (`sports/registry.color`). Clicking a session opens a `FocusModal` with the
  roster and per-athlete attendance controls.

Attendance recording:

- Inside the FocusModal, athletes render as a `DataGrid` with columns: avatar
  and name (pinned), status (`Segment` with `Present`, `Late`, `Absent`,
  `Excused`), notes (`TextField`), timestamps.
- Bulk verbs at the top: `Mark all present`, `Mark all absent`.
- Save closes the modal and updates the Agenda event's colour with an outline in
  the sport colour and a fill representing the attendance rate.

Drag interactions. Coaches can drag to reschedule a session (fires
`onEventMove`), drag to resize its duration (fires `onEventResize`), or drag on
empty grid slots to create a new session (fires `onEventCreate`, opening a
create sheet). All three interactions are gated by the `attendance.edit`
permission.

Mobile behaviour. On phone-sized viewports, the Agenda collapses to `day` view
only; the `Batch review` DataGrid alternate is the recommended fallback for
cross-day operations.

### Batch review view

Layout:

- Same KPI strip as above.
- Toolbar with date-range picker (`DateRangePicker`), sport filter, coach
  filter, status filter.
- `DataGrid` with columns: session name, session start, athlete avatar, athlete
  name, status chip, notes excerpt, actions.
- Bulk verbs: `Mark present`, `Mark absent`, `Mark late`, `Excuse`,
  `Export CSV`.

### Data model consequence

`attendance` records are per (session, athlete). The Agenda view surfaces them
by session; the Batch review view surfaces them by row. Both views read the same
resource. The active view is persisted in `?view=agenda` (default) or
`?view=batch` on the query string.

---

## 9. Settings module

Settings today is not present. This section defines it in full: routes,
secondary sidebar, section catalogue, JSON schema per key, scope inheritance,
danger zone, and folder layout (Appendix B).

The Settings module lives at `apps/web/src/modules/settings/*`. It is a full
module in the sense of the module registry (Section 3.1): it contributes one
resource (`settings`) with a `list` route at `/settings`, plus per-section
routes. It is filtered by the `settings.viewAny` permission.

### 9.1 Route map

The primary sidebar has a single `Settings` entry pointing at `/settings`, which
redirects to `/settings/general` on load. Inside the module, a secondary sidebar
renders every section. Route table:

| Route                     | Section                          |
| ------------------------- | -------------------------------- |
| `/settings`               | Redirects to `/settings/general` |
| `/settings/general`       | General                          |
| `/settings/branding`      | Branding                         |
| `/settings/locale`        | Locale and region                |
| `/settings/language`      | Language                         |
| `/settings/currency`      | Currency and tax                 |
| `/settings/sports`        | Sports catalogue                 |
| `/settings/notifications` | Notifications                    |
| `/settings/safeguarding`  | Safeguarding                     |
| `/settings/billing`       | Billing and subscription         |
| `/settings/integrations`  | Integrations                     |
| `/settings/api-keys`      | API keys                         |
| `/settings/webhooks`      | Webhooks                         |
| `/settings/feature-flags` | Feature flags                    |
| `/settings/attributes`    | Attributes                       |
| `/settings/data`          | Data and retention               |
| `/settings/danger`        | Danger zone                      |

The secondary sidebar groups sections:

- Workspace: General, Branding, Locale and region, Language, Currency and tax.
- Operations: Sports catalogue, Notifications, Safeguarding, Attributes.
- Money: Billing and subscription.
- Extend: Integrations, API keys, Webhooks, Feature flags.
- Advanced: Data and retention.
- Danger: Danger zone.

### 9.2 Section catalogue

Below, one paragraph per section. Each describes the section's contents, the
target user, and the scope (tenant, region, branch, user) at which its keys
live.

General. Basic workspace details: workspace name, workspace timezone, workspace
date format, workspace week-start day, workspace default landing surface. Target
user: workspace owner. Scope: tenant.

Branding. Logo (`FileUpload`), favicon, primary accent colour (`ColorPicker`),
custom domain, custom email sender name. Target user: workspace owner. Scope:
tenant.

Locale and region. Default language, enabled languages (`CheckboxButtonGroup`),
default currency, default timezone, default region hierarchy (used to seed new
branches). Target user: workspace owner. Scope: tenant.

Language. Per-user language override, RTL preview toggle, terminology overrides
(a table of `resource_key` -> `singular` / `plural` display, editable via
`TextField` rows). Target user: workspace owner (terminology) + individual user
(personal language). Scope: tenant (terminology) + user (personal language).

Currency and tax. Currency selection, exchange rate provider, tax jurisdictions
(a `DataGrid` of tax profiles), rounding rules, receipt footer. Target user:
finance owner. Scope: tenant with per-region override.

Sports catalogue. A `DataGrid` of sports, with age groups, formats, and default
pricing per sport. Target user: workspace owner. Scope: tenant with per-region
override for pricing.

Notifications. Notification channels (Email, SMS, Push, In-app), quiet hours,
notification preferences per event type (registration, payment, safeguarding,
attendance). Rendered as a matrix using `CheckboxButtonGroup`. Target user:
workspace owner (defaults) + individual user (personal preferences). Scope:
tenant (defaults) + user (personal).

Safeguarding. Policy URL, incident escalation contacts, mandatory training
frequency, whistleblowing hotline, retention policy for evidence, allowed
evidence file types. Target user: safeguarding officer. Scope: tenant.

Billing and subscription. Subscription plan, seat count, billing cycle, next
invoice, payment method (`Card`, `Bank`), invoice history (`DataGrid`), tax
profile link. Target user: finance owner. Scope: tenant.

Integrations. Available integrations catalogue (`ItemCardGroup`), connected
integrations (`DataGrid`), OAuth reauthentication buttons. Target user:
workspace owner or integration admin. Scope: tenant.

API keys. Personal access tokens and service-account keys (`DataGrid`), key
creation with scoped permissions and expiry. Target user: workspace owner.
Scope: tenant plus per-user personal tokens.

Webhooks. Registered webhooks (`DataGrid`), event subscriptions, secret
rotation, last delivery status. Target user: workspace owner. Scope: tenant.

Feature flags. Per-tenant feature toggles (`CheckboxButtonGroup`), per-branch
overrides, rollout percentage. Target user: workspace owner. Scope: tenant with
per-branch override.

Attributes. Custom attribute definitions (`DataGrid`), attribute type, target
resources, required flag. Target user: workspace owner. Scope: tenant.

Data and retention. Retention windows per resource, export tools, backup
schedule, data location. Target user: workspace owner or DPO. Scope: tenant.

Danger zone. Transfer ownership, close workspace, purge retention window, revoke
every API key. Target user: workspace owner. Scope: tenant.

### 9.3 Full settings JSON schema

Every setting is a typed key with a default, a scope, and a permission. The full
schema below defines the shape of `settings.tenant.*`, `settings.region.*`,
`settings.branch.*`, and `settings.user.*`. The schema is stored in
`apps/web/src/modules/settings/schema.ts` and rendered by section-specific
components.

Type annotations use TypeScript.

```ts
export interface SettingsSchema {
  tenant: TenantSettings;
  region: Record<string, RegionSettings>; // keyed by region id
  branch: Record<string, BranchSettings>; // keyed by branch id
  user: UserSettings; // for the active user
}

export interface TenantSettings {
  general: {
    workspace_name: string; // default: workspace slug
    workspace_slug: string; // default: tenant slug
    workspace_timezone: string; // default: "UTC"
    workspace_date_format: "DMY" | "MDY" | "YMD"; // default: "DMY"
    workspace_week_start: "sunday" | "monday" | "saturday"; // default: "monday"
    default_landing_route: string; // default: "/dashboard"
  };
  branding: {
    logo_url: string | null;
    favicon_url: string | null;
    accent_color: string; // default: "#1f6feb"
    custom_domain: string | null;
    custom_email_sender_name: string | null;
    email_footer_text: string | null;
  };
  locale: {
    default_language: string; // default: "en"
    enabled_languages: string[]; // default: ["en"]
    default_currency: string; // default: "USD"
    default_timezone: string; // default: same as workspace_timezone
    default_region_id: string | null;
  };
  terminology: Record<string, { singular: string; plural: string }>; // e.g. { "athletes": { singular: "Student", plural: "Students" } }
  currency: {
    exchange_rate_provider: "static" | "openexchangerates" | "ecb"; // default: "static"
    rounding: "half-up" | "half-even" | "banker"; // default: "half-up"
    receipt_footer: string | null;
  };
  tax_profiles: Array<{
    id: string;
    name: string;
    country_code: string;
    rate: number; // percent
    applies_to: Array<"registrations" | "memberships" | "passes" | "shop">;
  }>;
  sports_catalogue: Array<{
    id: string;
    key: string; // e.g. "football"
    name: string;
    category: "team" | "individual" | "martial";
    age_groups: string[]; // e.g. ["U8", "U10", "U12"]
    formats: string[]; // e.g. ["11-a-side", "7-a-side"]
    default_price: { amount: number; currency: string } | null;
    color: string;
  }>;
  notifications: {
    channels: {
      email: { enabled: boolean; from_address: string | null };
      sms: { enabled: boolean; provider: "twilio" | "vonage" | null };
      push: {
        enabled: boolean;
        ios_apns_key_id: string | null;
        android_fcm_project_id: string | null;
      };
      in_app: { enabled: boolean };
    };
    quiet_hours: { start: string; end: string; timezone: string }; // e.g. { start: "22:00", end: "07:00", timezone: workspace_timezone }
    defaults: Record<NotificationEventKey, NotificationChannelSet>; // per event type
  };
  safeguarding: {
    policy_url: string | null;
    escalation_contacts: Array<{ name: string; email: string; phone: string }>;
    training_frequency_days: number; // default: 365
    whistleblowing_hotline_url: string | null;
    evidence_retention_days: number; // default: 2555 (7 years)
    allowed_evidence_types: string[]; // e.g. ["image/jpeg", "image/png", "application/pdf"]
  };
  billing: {
    plan_key: string; // e.g. "growth"
    seat_count: number;
    billing_cycle: "monthly" | "annual";
    next_invoice_at: string | null;
    payment_method: {
      kind: "card" | "bank" | "wallet";
      last4: string;
      brand: string;
    } | null;
    tax_profile_id: string | null;
  };
  integrations: Array<{
    id: string;
    key: string; // e.g. "stripe", "mailchimp"
    status: "connected" | "disabled" | "error";
    connected_at: string | null;
    config: Record<string, unknown>; // opaque per-integration
  }>;
  api_keys: Array<{
    id: string;
    name: string;
    prefix: string; // display only, never full key
    scopes: string[];
    expires_at: string | null;
    last_used_at: string | null;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    events: string[]; // e.g. ["athlete.created", "payment.completed"]
    secret_prefix: string; // display only
    is_active: boolean;
    last_delivery_at: string | null;
    last_delivery_status: "success" | "failure" | "pending";
  }>;
  feature_flags: Record<string, boolean | { rollout_percent: number }>;
  attributes: Array<{
    id: string;
    key: string;
    name: string;
    type: "text" | "number" | "select" | "date" | "boolean";
    options: string[] | null; // for "select"
    target_resources: string[]; // e.g. ["athletes", "leads"]
    is_required: boolean;
  }>;
  data_retention: {
    per_resource: Record<string, { retention_days: number }>; // e.g. { "attendance": { retention_days: 730 } }
    export_provider: "s3" | "azure" | "gcs" | "none";
    backup_schedule: "daily" | "weekly" | "monthly";
    data_region: "eu" | "us" | "me" | "as";
  };
}

export interface RegionSettings {
  id: string;
  name: string;
  currency_override: string | null;
  timezone_override: string | null;
  language_override: string | null;
  tax_profile_id_override: string | null;
  sports_catalogue_overrides: Array<{
    sport_key: string;
    price_override: { amount: number; currency: string };
  }>;
}

export interface BranchSettings {
  id: string;
  region_id: string | null;
  timezone_override: string | null;
  language_override: string | null;
  currency_override: string | null;
  reception: {
    pin_enabled: boolean;
    pattern_enabled: boolean;
    default_unlock_method: "pin" | "pattern" | null;
    self_checkin_enabled: boolean;
  };
  facility_defaults: {
    booking_lead_days: number;
    booking_cancellation_hours: number;
  };
  feature_flag_overrides: Record<string, boolean>;
}

export interface UserSettings {
  language: string | null; // null means inherit
  timezone: string | null;
  date_format: "DMY" | "MDY" | "YMD" | null;
  theme: "light" | "dark" | "system"; // default: "system"
  notification_preferences: Record<
    NotificationEventKey,
    NotificationChannelSet
  >;
  dashboard_layout_id: string | null; // current layout
  keyboard_shortcuts_enabled: boolean; // default: true
  reduced_motion: boolean; // default: from OS
  reception_shortcut: string | null; // personal PIN for shared kiosk
}

export type NotificationEventKey =
  | "registration.new"
  | "registration.approved"
  | "registration.rejected"
  | "payment.paid"
  | "payment.overdue"
  | "payment.refunded"
  | "attendance.absence"
  | "attendance.late"
  | "safeguarding.new"
  | "safeguarding.escalated"
  | "credential.expiring"
  | "credential.expired"
  | "session.cancelled"
  | "session.reminder"
  | "announcement.published"
  | "lead.assigned"
  | "lead.stage-changed";

export interface NotificationChannelSet {
  email: boolean;
  sms: boolean;
  push: boolean;
  in_app: boolean;
}
```

Scope table. Every key above resolves through the inheritance chain user →
branch → region → tenant. A user setting overrides everything below it. A branch
setting overrides its region and tenant. A region setting overrides its tenant.

| Key                                            | Scope         | Overridable at               |
| ---------------------------------------------- | ------------- | ---------------------------- |
| `general.workspace_name`                       | tenant        | tenant                       |
| `general.workspace_timezone`                   | tenant        | tenant, region, branch       |
| `general.workspace_date_format`                | tenant        | tenant, user                 |
| `general.workspace_week_start`                 | tenant        | tenant, region               |
| `general.default_landing_route`                | tenant        | tenant, user                 |
| `branding.*`                                   | tenant        | tenant                       |
| `locale.default_language`                      | tenant        | tenant, region, branch, user |
| `locale.enabled_languages`                     | tenant        | tenant                       |
| `locale.default_currency`                      | tenant        | tenant, region, branch       |
| `locale.default_timezone`                      | tenant        | tenant, region, branch, user |
| `locale.default_region_id`                     | tenant        | tenant                       |
| `terminology.*`                                | tenant        | tenant                       |
| `currency.exchange_rate_provider`              | tenant        | tenant                       |
| `currency.rounding`                            | tenant        | tenant                       |
| `currency.receipt_footer`                      | tenant        | tenant, region, branch       |
| `tax_profiles.*`                               | tenant        | tenant, region               |
| `sports_catalogue.*`                           | tenant        | tenant, region (price only)  |
| `notifications.channels.*`                     | tenant        | tenant                       |
| `notifications.quiet_hours`                    | tenant        | tenant, user                 |
| `notifications.defaults.*`                     | tenant        | tenant, user                 |
| `safeguarding.*`                               | tenant        | tenant                       |
| `billing.*`                                    | tenant        | tenant                       |
| `integrations.*`                               | tenant        | tenant                       |
| `api_keys.*`                                   | tenant + user | user for personal tokens     |
| `webhooks.*`                                   | tenant        | tenant                       |
| `feature_flags.*`                              | tenant        | tenant, branch               |
| `attributes.*`                                 | tenant        | tenant                       |
| `data_retention.*`                             | tenant        | tenant                       |
| `user.language`                                | user          | user                         |
| `user.timezone`                                | user          | user                         |
| `user.date_format`                             | user          | user                         |
| `user.theme`                                   | user          | user                         |
| `user.notification_preferences.*`              | user          | user                         |
| `user.dashboard_layout_id`                     | user          | user                         |
| `user.keyboard_shortcuts_enabled`              | user          | user                         |
| `user.reduced_motion`                          | user          | user                         |
| `user.reception_shortcut`                      | user          | user                         |
| `reception.pin_enabled`                        | branch        | branch                       |
| `reception.pattern_enabled`                    | branch        | branch                       |
| `reception.default_unlock_method`              | branch        | branch                       |
| `reception.self_checkin_enabled`               | branch        | branch                       |
| `facility_defaults.booking_lead_days`          | branch        | branch                       |
| `facility_defaults.booking_cancellation_hours` | branch        | branch                       |
| `feature_flag_overrides.*`                     | branch        | branch                       |

Deprecation policy. Every setting key documents:

- `since` version.
- `deprecated` version (null if active).
- `removed` version (null if not yet planned).
- Replacement key (if any).

Removed keys are honoured on read for one release cycle and dropped afterwards.
A `settings.deprecations` audit event fires every time a deprecated key is read.

### 9.4 Per-section anatomy

Every section renders inside a `SectionContainer` from `@academorix/ui/react`
with a title and a description. The section contents are one of three patterns:

1. Row form. A vertical list of setting rows using `CellSelect`, `CellSwitch`,
   `CellSlider`, `CellColorPicker`, `TextField`, `NumberField`, `PhoneInput`.
   Each row spans the full width, with the label on the left and the input on
   the right. Save is auto-debounced (500 milliseconds after last change) with a
   `Saved` chip appearing on success.

2. Table. A `DataGrid` for lists (`tax_profiles`, `sports_catalogue`,
   `api_keys`, `webhooks`, `attributes`, `integrations`, `feature_flags`). Bulk
   verbs from Section 5.4 apply per section.

3. Composite. A hybrid of rows and tables (`notifications` shows channels as
   rows and defaults as a per-event matrix).

Every section is under-permissioned by default and enabled per-permission. A
user without `settings.branding.edit` can view the branding section in read-only
mode; the primary action buttons render disabled.

### 9.5 Scope inheritance model

The dashboard is used at four scales - a single branch, a network of branches
inside a region, a network of regions inside an organisation, and an individual
user's preferences. The scope inheritance model handles all four:

- Tenant is the default. A tenant-level setting applies to every region, branch,
  and user unless overridden.
- Region overrides tenant. A region-level setting (e.g. currency, language)
  applies to every branch in that region unless the branch overrides.
- Branch overrides region. A branch-level setting applies to every user in that
  branch unless the user overrides.
- User overrides everything above where the key is user-scoped.

The UI reflects inheritance visually. Every setting row shows an `InheritedChip`
when the value is not explicitly set at the current scope. Clicking `Override`
promotes the value from inherited to explicit and enables editing at the current
scope. Clicking `Reset` demotes an explicit value back to inherited.

Recommended default:

- Region is opt-in per tenant. Small tenants do not need regions. Enabling
  regions is a workspace-owner action in the Locale section (`Enable regions`).
- Branch always exists.
- The active working scope in the navbar (Section 3.3) drives what a Settings
  row means. When the user is scoped to `Riyadh Central`, the branch-level
  settings section shows Riyadh Central's overrides; the tenant-level section
  shows tenant defaults.

Region management. When regions are enabled, the tenant owner defines regions in
`/settings/locale`. Each region has a `RegionSettings` row (Section 9.3) and can
override currency, language, timezone, tax profile, and sports catalogue
pricing. Branches are then attached to regions.

Currency scope. Currency inherits from tenant, is overridable at region, and is
overridable at branch. Payments always use the branch currency at the time of
payment.

Language scope. Language inherits from tenant, is overridable at region, branch,
and user. UI text renders in the user's preferred language; documents render in
the branch's language.

Timezone scope. Timezone inherits from tenant, is overridable at region, branch,
and user. Every timestamp on the wire is UTC; every display renders in the
effective timezone.

### 9.6 Danger zone patterns

Every action in `/settings/danger` uses `PressableFeedback.HoldConfirm` with a
duration of 4000 milliseconds and a `ConfirmDialog` with a typed confirmation.
Actions:

- Transfer ownership. Typed confirmation is the workspace slug. Transfers
  workspace ownership to another user; user must accept via email.
- Close workspace. Typed confirmation is the workspace slug. Suspends the
  workspace and schedules deletion in 30 days.
- Purge retention window. Typed confirmation is the phrase `PURGE`. Deletes
  records older than the retention window immediately.
- Revoke every API key. Typed confirmation is the phrase `REVOKE ALL`.
- Reset every user layout to default. Typed confirmation is the phrase
  `RESET LAYOUTS`.

Every danger action logs to the audit trail (`admin` module) with the actor, the
target, the timestamp, and any typed confirmation entered.

---

## 10. Analytics and reporting surface

Analytics is a first-class capability of the dashboard, split between three
surfaces:

1. Overview page widgets (Section 4). Fast, always-on charts and KPIs for the
   current scope. Users add or remove charts through the widget picker.
2. Per-module analytics tabs. Every listing has an `Analytics` tab in the detail
   page (`/athletes/:id?tab=analytics`, `/teams/:id?tab=analytics`) showing
   per-record trends inside `Widget` containers. Common charts: attendance rate
   over time, performance progression, payment history.
3. `/reports` module. The reporting hub, purpose-built for long-form reports,
   saved queries, scheduled exports, and cross-module views.

### `/reports` module anatomy

Root page (`/reports`):

- Toolbar: search, date-range picker, report-type filter,
  `Button variant="primary"` labelled `New report`.
- Two sections:
  - Saved reports. `DataGrid` with columns: report title, owner avatar, last-run
    timestamp, schedule chip, share chip.
  - Report library. `ItemCardGroup` of curated templates: `Revenue analysis`,
    `Attendance rate`, `Coach utilisation`, `Lead conversion funnel`,
    `Membership cohort`, `Safeguarding incidents`, `Payments overdue`,
    `Credential compliance`, `Facility utilisation`, `Registration by sport`.

Detail page (`/reports/:id`):

- Header: report title, `Button variant="primary"` labelled `Run`, dropdown with
  `Export CSV`, `Export PDF`, `Duplicate`, `Share`, `Delete`.
- `FloatingToc` from `@heroui-pro/react` in the right rail for long reports.
- Body: a stack of `SectionContainer` blocks. Each section can contain a
  `Widget` with a chart, a `DataGrid`, or a `Markdown` block for narrative text.

Widget-to-report link. Any widget on the overview can be sent to `/reports` as a
new saved report via the widget's overflow menu (`KPI.Actions` on KPIs, a menu
on Widget headers). The report inherits the chart, the source query, and the
current scope filters. Users then extend the report with additional sections.

DataGrid export. Every DataGrid across the app has an `Export CSV` toolbar
button. CSV export is client-side for small (<1000-row) grids and server-side
(through a background job) for larger ones. Server-side exports fire a
notification when ready (Section 11).

Saved queries. A query saved on any listing (as a saved view, Section 5.6) can
be promoted to a report from the saved-view menu.

---

## 11. Notifications and real-time

### 11.1 Toast rules

`Toast` from `@heroui/react` for ephemeral notices. Rules:

- Placement: top-right on desktop, bottom on mobile.
- Duration: 4 seconds for success, 8 seconds for error, 6 seconds for
  undo-eligible.
- One-at-a-time: successive toasts stack, but the stack collapses to 3 visible
  items with a `+N more` counter.
- Never blocks user input. Toasts are decorative, not modal.
- Never replaces the notification center. The notification center is durable;
  toasts are transient.

Toast types:

- Success (`variant="success"`): completion of a mutation.
- Info (`variant="default"`): non-blocking notice
  (`Scope switched to Riyadh Central`, `Draft saved`).
- Warning (`variant="warning"`): recoverable warning
  (`Some athletes were skipped`, `Rate limit exceeded, retry in 30 seconds`).
- Danger (`variant="danger"`): failed mutation.

### 11.2 Notification bell and drawer

The bell in the navbar (Section 3.3) opens the notification drawer (Section
3.5). This is the durable surface - every notification the user has received is
here, categorised by tab.

Notification event types match the `NotificationEventKey` enum in Section 9.3.
Each event maps to a template with:

- Title (short, past-tense verb).
- Description (one line naming the target).
- Action link (URL that navigates to the target detail page).
- Icon (module icon).
- Priority (`normal` | `high`).

### 11.3 Real-time badges on sidebar items

Every sidebar item can render a `Badge` inside `Sidebar.MenuIcon` showing an
unread or open count. Real-time transport options:

- Server-Sent Events (SSE) from `/api/notifications/stream`. The client
  subscribes to the current user's stream and updates the badge in-place.
- WebSocket over `/ws`. Same idea; used when the backend needs bidirectional
  (typing indicators for messaging, live check-in for reception).

The plan prefers SSE for read-only badges (unread counts, module activity) and
WebSocket for interactive modules (`messaging`, `reception`, `sports/attendance`
when a coach is live-taking attendance).

Fallback. When the transport is unavailable, badges refresh on a 60-second
interval via `useList` with `pageSize: 1` on the filtered resource. This
preserves the existing pattern from `dashboard-page.tsx`.

Badge colours:

- Default sidebar badge: `variant="default"`.
- Overdue payments, expiring credentials: `color="warning"`.
- Overdue past due, expired credentials, high-severity safeguarding:
  `color="danger"`.

Badges dismiss when the user opens the module and the record is viewed.

---

## 12. Command palette playbook

`Command` from `@heroui-pro/react` is the global launcher, keyed to `⌘ K`
(macOS) and `Ctrl K` (elsewhere). It renders every command the dashboard
exposes: navigation, creation, search, actions.

### Root palette

When the palette opens with no input, it shows five groups:

- Recent: the last 5 records the user opened.
- Navigate: every module (52 items).
- Create: every module with a `create` route.
- Actions: contextual verbs (`Switch to <branch>`, `Sign out`, `Toggle theme`,
  `Open Settings`, `Copy link to current page`).
- Help: `Open documentation`, `Show keyboard shortcuts`, `Contact support`,
  `Changelog`.

### Typed input

When the user types, the palette re-scores commands using HeroUI Pro's default
filter (case-insensitive contains match). It also fires background searches
against athletes, coaches, teams, invoices, and leads. Results appear in
additional groups (`Athletes`, `Coaches`, `Teams`, `Invoices`, `Leads`) below
the standard groups.

### Command catalogue (per module)

Below, per module, the commands the palette exposes. Every command uses the
tenant's terminology.

| Module                 | Navigate command      | Create command      | Search command        | Bulk action commands                                                 |
| ---------------------- | --------------------- | ------------------- | --------------------- | -------------------------------------------------------------------- |
| `dashboard`            | Go to Dashboard       | -                   | -                     | Customise dashboard, Add widget, Reset layout, Save layout as preset |
| `access`               | Go to Access          | New access rule     | Search access rules   | Enable rule, Disable rule                                            |
| `admin`                | Go to Admin           | -                   | Search approvals      | Approve selected, Reject selected                                    |
| `ai`                   | Go to AI              | New AI conversation | Search AI history     | Archive conversation                                                 |
| `announcements`        | Go to Announcements   | New announcement    | Search announcements  | Publish, Unpublish, Schedule, Duplicate                              |
| `attributes`           | Go to Attributes      | New attribute       | Search attributes     | Publish, Retire                                                      |
| `billing`              | Go to Billing         | New billing profile | Search profiles       | Send statement, Adjust balance                                       |
| `branches`             | Go to Branches        | New branch          | Search branches       | Activate, Deactivate, Rename                                         |
| `credentials`          | Go to Credentials     | New credential      | Search credentials    | Approve, Renew, Revoke, Send reminder                                |
| `documents`            | Go to Documents       | Upload document     | Search documents      | Publish, Retire, Move folder                                         |
| `entitlements`         | Go to Entitlements    | -                   | Search entitlements   | Extend, Revoke                                                       |
| `expenses`             | Go to Expenses        | Record expense      | Search expenses       | Approve, Reject, Reimburse                                           |
| `facilities`           | Go to Facilities      | New facility        | Search facilities     | Publish, Retire                                                      |
| `integrations`         | Go to Integrations    | Connect integration | Search integrations   | Enable, Disable, Reconnect                                           |
| `leads`                | Go to Leads           | Add lead            | Search leads          | Assign owner, Change stage, Convert                                  |
| `memberships`          | Go to Memberships     | Create plan         | Search memberships    | Renew, Suspend, Reactivate, Refund                                   |
| `messaging`            | Go to Messages        | New conversation    | Search conversations  | Assign to staff, Close conversation                                  |
| `notifications`        | Go to Notifications   | -                   | Search notifications  | Mark read, Dismiss                                                   |
| `offline-sync`         | Go to Offline sync    | -                   | -                     | Retry, Discard                                                       |
| `organization`         | Go to Organisation    | -                   | -                     | -                                                                    |
| `passes`               | Go to Passes          | Design pass         | Search passes         | Publish, Retire, Duplicate                                           |
| `payments`             | Go to Payments        | Create invoice      | Search payments       | Mark paid, Send reminder, Refund, Void                               |
| `people`               | Go to People          | Invite person       | Search people         | Invite, Suspend, Reactivate                                          |
| `public-site`          | Go to Public site     | -                   | -                     | Publish, Preview                                                     |
| `reception`            | Go to Reception       | -                   | Search check-ins      | Check in, Check out, Reset PIN                                       |
| `regions`              | Go to Regions         | New region          | Search regions        | Activate, Deactivate                                                 |
| `reports`              | Go to Reports         | New report          | Search reports        | Duplicate, Share, Retire                                             |
| `safeguarding`         | Go to Safeguarding    | Log case            | Search cases          | Assign owner, Change status, Escalate                                |
| `staff`                | Go to Staff           | Invite staff        | Search staff          | Invite, Suspend, Reactivate, Change role                             |
| `users`                | Go to Users           | Invite user         | Search users          | Invite, Suspend, Reactivate                                          |
| `workspace`            | Go to Workspace       | New workspace       | Search workspaces     | Rename, Transfer ownership                                           |
| `sports/athletes`      | Go to Athletes        | Register athlete    | Search athletes       | Assign to team, Move to branch, Send invitation                      |
| `sports/attendance`    | Go to Attendance      | -                   | Search attendance     | Mark present, Mark absent                                            |
| `sports/awards`        | Go to Awards          | Log award           | Search awards         | Publish, Unpublish                                                   |
| `sports/coaching`      | Go to Coaching        | New plan            | Search plans          | Publish, Retire                                                      |
| `sports/competition`   | Go to Competitions    | New competition     | Search competitions   | Publish, Retire                                                      |
| `sports/development`   | Go to Development     | New pathway         | Search pathways       | Publish, Retire                                                      |
| `sports/drills`        | Go to Drills          | New drill           | Search drills         | Publish, Retire, Add to plan                                         |
| `sports/events`        | Go to Events          | Plan event          | Search events         | Publish, Unpublish                                                   |
| `sports/formations`    | Go to Formations      | Design formation    | Search formations     | Duplicate, Assign to team                                            |
| `sports/matches`       | Go to Matches         | Record match        | Search matches        | Publish scores, Unpublish                                            |
| `sports/medical`       | Go to Medical         | New record          | Search records        | Mark cleared, Mark on hold                                           |
| `sports/performance`   | Go to Performance     | New assessment      | Search assessments    | Publish, Reset                                                       |
| `sports/progress`      | Go to Progress        | New note            | Search progress notes | Archive                                                              |
| `sports/registrations` | Go to Registrations   | New registration    | Search registrations  | Approve, Reject, Convert                                             |
| `sports/registry`      | Go to Sports registry | Add sport           | Search sports         | Publish, Retire                                                      |
| `sports/seasons`       | Go to Seasons         | Create season       | Search seasons        | Publish, Close, Duplicate                                            |
| `sports/sessions`      | Go to Sessions        | Schedule session    | Search sessions       | Duplicate, Cancel                                                    |
| `sports/teams`         | Go to Teams           | Create team         | Search teams          | Assign coach, Move to season                                         |
| `sports/training`      | Go to Training        | Design programme    | Search programmes     | Publish, Archive                                                     |

Palette contribution API. Modules contribute commands by exporting a
`CommandCatalogue` alongside the module manifest:

```ts
export interface ModuleCommandCatalogue {
  navigate?: { label: string; route: string; icon?: IconType }[];
  create?: {
    label: string;
    route: string;
    icon?: IconType;
    requiredPermission?: string;
  }[];
  search?: {
    label: string;
    resource: string;
    fields: string[]; // fields to match against user input
    render: (record: BaseRecord) => ReactNode;
    routeForRecord: (record: BaseRecord) => string;
  }[];
  actions?: {
    label: string;
    icon?: IconType;
    onAction: () => void;
    requiredPermission?: string;
  }[];
}
```

`AuthenticatedLayout` aggregates every module's `commands` and passes them to
the palette.

Nested groups. When the palette gets busy, groups collapse under module headers.
Selecting the module header enters a scoped palette (see the `Clean` example in
the `Command` docs for the pattern).

---

## 13. Accessibility and i18n

### 13.1 RTL (Arabic) considerations

Arabic is a first-class language. Every layout, form, icon, and animation must
work with `dir="rtl"` on the root. Rules:

- Use CSS logical properties (`inline-start`, `inline-end`,
  `padding-inline-start`, `margin-inline-end`) instead of directional properties
  (`left`, `right`, `padding-left`, `margin-right`). HeroUI Pro's own CSS
  already does this; the plan requires that module code follow the same
  discipline.
- Icons that carry directional meaning (arrows, chevrons for `next`/`previous`,
  sort indicators) must flip in RTL. HeroUI Pro exposes logical variants; use
  them.
- Numbers stay LTR even inside RTL text. `NumberValue` handles this via
  `Intl.NumberFormat`.
- Column direction in `DataGrid` reverses in RTL. Pinned `start` columns render
  on the right visually; pinned `end` columns render on the left visually.
  HeroUI Pro handles this natively via `inset-inline-start`.
- Keyboard shortcuts remain physical (`⌘ K` is `⌘ K` in RTL), not logical.
- Text alignment: right in RTL by default. `text-start` and `text-end` for
  logical alignment.
- Fonts: use the tenant's chosen font stack, which must include an Arabic
  fallback (`Cairo`, `Noto Naskh Arabic`, or system Arabic). Configure the
  fallback in Section 15.

RTL testing is part of every PR that touches the dashboard shell or a listing.
The `AuthenticatedLayout` renders correctly under `dir="rtl"` today; new
components must maintain that.

### 13.2 Keyboard shortcuts registry

Keyboard shortcuts come from two sources that compose at boot:

1. Global chrome shortcuts. A central catalogue in
   `apps/web/src/lib/keyboard/registry.ts` for verbs that do not belong to any
   resource (open the command palette, toggle a sidebar, focus a search field,
   toggle theme or density). These are hand-authored in a single file and
   shipped as part of the shell.
2. Resource-scoped shortcuts. Declared on each module manifest via
   `AppResourceMeta.shortcuts` (see `apps/web/src/lib/module/module.ts`). The
   `import.meta.glob` registry in `apps/web/src/lib/module/registry.ts`
   aggregates every manifest at boot, resolves the target route from the
   resource's `list` and `create` URLs, and emits `appResourceShortcuts` for the
   shell to consume. A duplicate-sequence check runs in the same pass and logs
   `console.warn` in dev on any collision; the first-registered binding wins.

Why the split. Global shortcuts belong to no module and would drift if pushed
into module manifests. Resource shortcuts are the same class of identifier as
`label`, `icon`, `requiredPermission`, and `order`: they belong with the module
that owns the route, they inherit its permission gating for free, they carry the
tenant terminology through `useResourceLabel` when rendered in the `?` panel,
and they get uniqueness validation at the same layer that already validates
`dataProviderName`. Ownership stays with the module; adding, renaming, or
deleting a module carries its shortcut with it.

The user can view the effective registry via `?` from anywhere in the app, or
via the `Show keyboard shortcuts` command. Personal overrides live in
`settings.user.keyboard_shortcuts_enabled` (Section 9.3); when the shell later
supports remapping, the remap replaces the sequence but keeps the action id
(`resourceName` + `action`) stable so a saved layout does not break when a
shortcut is rebound.

Only high-traffic modules get a leader-key binding today. The command palette
(`⌘ K`) is the fallback for every module, so the collision surface stays small
and the shortcut list stays memorisable.

Global shortcuts (central registry):

| Shortcut         | Action                                                        |
| ---------------- | ------------------------------------------------------------- |
| `⌘ K` / `Ctrl K` | Open command palette                                          |
| `⌘ B` / `Ctrl B` | Toggle primary sidebar                                        |
| `⌘ /` / `Ctrl /` | Toggle secondary sidebar (Settings and modules that have one) |
| `⌘ Enter`        | Submit form in focused modal                                  |
| `Esc`            | Close topmost overlay                                         |
| `/`              | Focus search on active listing                                |
| `?`              | Open keyboard shortcuts panel                                 |
| `T`              | Toggle theme                                                  |
| `Shift D`        | Toggle density (compact / comfortable)                        |

Resource-scoped shortcuts (declared on each module's
`AppResourceMeta.shortcuts`):

| Sequence      | Action            | Module            | Resource                 | List URL                  | Create URL                 |
| ------------- | ----------------- | ----------------- | ------------------------ | ------------------------- | -------------------------- |
| `G D`         | Navigate          | `dashboard`       | `dashboard`              | `/dashboard`              | -                          |
| `G A` / `N A` | Navigate / Create | `sports/athletes` | `athletes`               | `/athletes`               | `/athletes/create`         |
| `G T` / `N T` | Navigate / Create | `sports/teams`    | `teams`                  | `/teams`                  | `/teams/create`            |
| `G S` / `N S` | Navigate / Create | `sports/sessions` | `private-sessions`       | `/private-sessions`       | `/private-sessions/create` |
| `G M` / `N M` | Navigate / Create | `sports/matches`  | `matches`                | `/matches`                | `/matches/create`          |
| `G E` / `N E` | Navigate / Create | `sports/events`   | `events`                 | `/events`                 | `/events/create`           |
| `G C`         | Navigate          | `sports/coaching` | `coaches`                | `/coaches`                | -                          |
| `G L` / `N L` | Navigate / Create | `leads`           | `leads`                  | `/leads`                  | `/leads/create`            |
| `G P`         | Navigate          | `payments`        | `invoices`               | `/invoices`               | -                          |
| `G R`         | Navigate          | `reports`         | `reports`                | `/reports`                | -                          |
| `G B` / `N B` | Navigate / Create | `branches`        | `branches`               | `/branches`               | `/branches/create`         |
| `G F`         | Navigate          | `facilities`      | `facilities`             | `/facilities`             | -                          |
| `G I` / `N I` | Navigate / Create | `integrations`    | `integrations`           | `/integrations`           | `/integrations/create`     |
| `G N`         | Navigate          | `notifications`   | `notification-templates` | `/notification-templates` | -                          |
| `G X` / `N X` | Navigate / Create | `expenses`        | `expenses`               | `/expenses`               | `/expenses/create`         |

Modules not in the table (access, admin, ai, announcements, attributes, awards,
coaching sub-resources, credentials, documents, memberships, messaging,
offline-sync, organization, passes, people, public-site, reception, regions,
safeguarding, staff, seasons, competition, drills, formations, medical,
performance, progress, registrations, registry, training, attendance, users,
workspace) are reachable through the command palette (`⌘ K → Go to <label>` or
`⌘ K → New <singular label>`). The command palette is populated from the same
`appResources` array, so every module is reachable without ceremony.

The `G ,` binding for Settings appears once the Settings module ships (Phase 4
of the roadmap). Until then, `G ,` is unassigned.

Manifest example (Athletes):

```tsx
// apps/web/src/modules/sports/athletes/athletes.module.tsx
{
  name: "athletes",
  list: "/athletes",
  create: "/athletes/create",
  edit: "/athletes/:id/edit",
  show: "/athletes/:id",
  meta: {
    label: "Athletes",
    icon: AcademicCapIcon,
    featureKey: "athletes",
    requiredPermission: "athletes.viewAny",
    order: 10,
    scopedBy: ["branch"],
    shortcuts: {
      navigate: "G A",
      create: "N A",
    },
  },
}
```

Listing-scoped shortcuts (active only when a DataGrid has focus):

| Shortcut            | Action                          |
| ------------------- | ------------------------------- |
| `J`                 | Select next row                 |
| `K`                 | Select previous row             |
| `X`                 | Toggle selection on focused row |
| `Enter`             | Open focused row                |
| `E`                 | Edit focused row                |
| `⌘ A`               | Select all rows                 |
| `⌘ Shift A`         | Clear selection                 |
| `Del` / `Backspace` | Prompt delete on selected rows  |

Detail-page shortcuts:

| Shortcut            | Action        |
| ------------------- | ------------- |
| `1` to `9`          | Jump to tab N |
| `E`                 | Edit record   |
| `Del` / `Backspace` | Prompt delete |

Command palette internal:

| Shortcut    | Action                                          |
| ----------- | ----------------------------------------------- |
| `↑` / `↓`   | Navigate                                        |
| `Enter`     | Select                                          |
| `⌘ Enter`   | Open in new tab                                 |
| `Backspace` | Return to parent group (when in nested palette) |

### 13.3 Focus management

- Every overlay (Modal, Drawer, Popover, Command, FocusModal, HoverCard) traps
  focus while open.
- Every overlay returns focus to the invoking element on close.
- Every listing restores focus to the row that opened the detail on
  back-navigation.
- Every route change moves focus to the page heading (`h1`) via `AppLayout`'s
  `focus` region.
- Every skeleton or spinner replaces content in-place, not the page focus.

### 13.4 Motion and prefers-reduced-motion

- Every HeroUI Pro animated component (Command, Kanban, Agenda,
  PressableFeedback) already respects `prefers-reduced-motion` via
  `motion-reduce:animate-none`. Module code inherits this by using those
  components.
- Custom drag-and-drop in the widget grid (Section 4.2) must also respect
  `prefers-reduced-motion`. `react-grid-layout` supports this via a
  `useCSSTransforms={!prefersReducedMotion}` prop; the plan requires this
  wiring.
- Ripple and highlight from `PressableFeedback` are opt-in; when the user has
  `settings.user.reduced_motion = true`, the shell wraps `PressableFeedback` in
  a component that no-ops the animation and preserves the click behaviour.

---

## 14. Performance

### 14.1 DataGrid virtualization thresholds

Every listing follows this rule:

- Under 200 rows: no virtualization. `virtualized={false}`. Rendering cost is
  negligible.
- 200 to 5000 rows: pagination stays enabled (page size 50 by default). No
  virtualization; the DOM only ever holds 50 rows.
- Over 5000 rows with pagination off (very rare): `virtualized={true}` with
  `rowHeight` and `headingHeight` set. Only visible rows render.
- Any listing with `pagination: { mode: "off" }` (used inside widgets and
  dropdowns) sets `virtualized={true}` when the row count exceeds 200.

The `ResourceDataGrid` bridge exposes a `virtualizationHint` prop that
automatically wires `virtualized`, `rowHeight`, and `headingHeight` based on the
resource's expected row density.

### 14.2 Query invalidation strategy on scope switch

Every list, KPI, widget, and detail query is scoped to the active organisation,
region, branch, and season. When the user switches scope in the navbar, every
query in the current router state must invalidate and refetch. The
`buildScopeFilters` helper already threads scope through Refine's `useTable` and
`useList`, so the query key changes with scope; Refine invalidates
automatically.

Nuances:

- Cross-scope data (e.g. `/reports` that spans branches) uses a scope-agnostic
  key and explicit filter arguments. It does not invalidate on scope switch.
- The mock-data-provider fix in commit `81f4555` normalised scope-key
  propagation so mock and REST behave identically. New surfaces must not bypass
  `buildScopeFilters`.
- Optimistic mutations set `mutationMode: "optimistic"` on high-frequency verbs
  (attendance ticks, message read state) and `mutationMode: "pessimistic"` on
  money verbs (`payments`, `expenses`, `billing`).

Cache tuning:

- Default `staleTime`: 30 seconds for listings, 60 seconds for KPIs, 5 minutes
  for `/settings`, and 0 for user-owned mutations.
- Default `gcTime`: 10 minutes.
- `refetchOnWindowFocus` is enabled globally for lists and KPIs and disabled for
  widgets that are heavy to compute.

### 14.3 Code-splitting recommendations

- Every module page is already lazy-loaded via `React.lazy` in the module
  manifest. Do not eagerly import module pages from `App.tsx`.
- Charts are heavy. Import `@heroui-pro/react` chart components inside a
  `Widget` renderer wrapped in `React.lazy` so a user without analytics widgets
  does not pay the cost.
- `@heroui-pro/react` `Kanban`, `Agenda`, and `Command` are individually
  lazy-loaded. `AuthenticatedLayout` mounts `Command` eagerly (it is the
  launcher) but only imports the palette contents on open.
- `@academorix/ui/react` `FocusModal` and `ProgressAccordion` are individually
  lazy-loaded.

Route-level code-splitting keeps the initial bundle small. Feature-level
code-splitting keeps modules that are unused (a tenant without `safeguarding`
enabled never downloads safeguarding code) out of the runtime.

---

## 15. Design tokens

The dashboard inherits its tokens from HeroUI Pro's `default` theme, extended
with a small palette of Academorix-specific tokens. Every token below is a CSS
custom property exposed by `@heroui/styles`.

Core semantic colours (already provided):

- `--color-accent` - brand accent.
- `--color-accent-foreground`.
- `--color-success` - for `Active`, `Paid`, `Complete` states.
- `--color-warning` - for `Pending`, `Trial`, `Expiring` states.
- `--color-danger` - for `Overdue`, `Failed`, `Deleted` states.
- `--color-background` - page background.
- `--color-surface` - card and widget background.
- `--color-surface-secondary` - inset background inside Widget.
- `--color-foreground` - primary text.
- `--color-muted` - secondary text.
- `--color-border`, `--color-separator` - borders and dividers.
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl` -
  corner radii.
- `--font-size-*`, `--font-weight-*`, `--line-height-*` - typography.
- `--spacing-*` - spacing scale.
- `--shadow-*` - elevations.

Academorix-specific tokens (added on top):

- `--color-role-owner` - for owner-role badges.
- `--color-role-coach` - coach role.
- `--color-role-reception` - reception role.
- `--color-role-finance` - finance role.
- `--color-role-athlete` - athlete role.
- `--color-sport-<key>` - per-sport accent (populated from
  `settings.tenant.sports_catalogue`). Widgets and Agenda events read this at
  render time. Example: `--color-sport-football`, `--color-sport-swimming`.
- `--color-status-lead-new` through `--color-status-lead-lost` - lead pipeline
  colours for Kanban columns and cells.
- `--color-status-attendance-present`, `--color-status-attendance-late`,
  `--color-status-attendance-absent`, `--color-status-attendance-excused`.
- `--color-status-payment-paid`, `--color-status-payment-pending`,
  `--color-status-payment-overdue`, `--color-status-payment-refunded`,
  `--color-status-payment-void`.
- `--color-safeguarding-severity-low`, `--color-safeguarding-severity-medium`,
  `--color-safeguarding-severity-high`.

Font stack:

- Primary Latin: `Inter, system-ui, sans-serif`.
- Arabic fallback: `Cairo, "Noto Naskh Arabic", system-ui, sans-serif`.
- Mono: `"JetBrains Mono", ui-monospace, monospace` for API keys, invoice
  numbers, and payload previews.

Custom tokens are declared in `packages/ui/src/react/styles/academorix.css` and
imported once from `apps/web/src/main.tsx`.

---

## 16. Implementation roadmap

Five phases. Each phase ships a coherent user-visible slice. No phase depends on
the phase after it, so re-prioritisation is cheap.

### Phase 1: Overview and shell (2 to 3 weeks)

Modules touched: `dashboard`, `components/layout`, `components/scope`,
`lib/module`.

Components added:

- `apps/web/src/modules/dashboard/pages/dashboard-page.tsx` upgraded from four
  KPI cards to the full widget grid (Section 4).
- `apps/web/src/modules/dashboard/widgets/*.tsx` with one file per widget in the
  catalogue (Section 4.5).
- `apps/web/src/modules/dashboard/widgets.catalogue.ts` and
  `apps/web/src/modules/dashboard/onboarding.ts`.
- `apps/web/src/modules/dashboard/components/widget-grid.tsx` (drag-and-drop
  grid).
- `apps/web/src/modules/dashboard/components/widget-picker.tsx`.
- `apps/web/src/modules/dashboard/components/onboarding-checklist.tsx`.
- `apps/web/src/modules/dashboard/components/saved-layouts.tsx`.
- New resource: `dashboard_layouts` and `dashboard_onboarding_state`.
- New route: `/dashboard?view=analytics` (query-driven).

Shell additions:

- Sidebar grouping (`Sidebar.Group`) in `authenticated-layout.tsx`.
- Global search trigger in the navbar.
- Notification bell in the navbar (Section 3.3).
- Help popover in the navbar.

Estimated effort: 40 engineering days (2 engineers for 2 weeks, plus design for
1 week).

### Phase 2: Canonical listing pattern rollout (4 to 5 weeks)

Modules touched: every module with a listing.

Components added:

- `apps/web/src/components/refine/listing-toolbar.tsx` (search + filters +
  sort + columns + view).
- `apps/web/src/components/refine/listing-action-bar.tsx` (bridge to HeroUI Pro
  `ActionBar`).
- `apps/web/src/components/refine/listing-empty-state.tsx` (bridge to HeroUI Pro
  `EmptyState` with module-specific copy).
- `apps/web/src/components/refine/listing-filter-chips.tsx`.
- `apps/web/src/components/refine/listing-saved-views.tsx`.
- Extension of `ResourceDataGrid` to accept `kpi`, `toolbar`, `bulkActions`,
  `emptyState`, `viewMode`, `filterChips`, `savedViews` props.
- Per-module KPI definitions in `apps/web/src/modules/<module>/kpis.ts`.
- Per-module column definitions in `apps/web/src/modules/<module>/columns.tsx`.
- Per-module bulk verbs in `apps/web/src/modules/<module>/bulk-actions.ts`.
- Cell composites in `apps/web/src/components/refine/cells/`.

New resources:

- `resource_views` (saved views).
- `dashboard_column_widths` (per-user column width persistence).

Estimated effort: 100 engineering days. Rolled out in waves of 8 to 10 modules
per week.

### Phase 3: Detail pages and forms (4 to 5 weeks)

Modules touched: every module with a detail page.

Components added:

- `apps/web/src/components/detail/detail-header.tsx`.
- `apps/web/src/components/detail/detail-tabs.tsx`.
- `apps/web/src/components/detail/detail-timeline.tsx` (bridge to HeroUI Pro
  `Timeline`).
- `apps/web/src/components/detail/detail-side-rail.tsx`.
- `apps/web/src/components/forms/focus-modal-form.tsx` (bridge to `FocusModal` +
  `progress-tabs` or `progress-accordion`).
- `apps/web/src/components/forms/drawer-form.tsx`.
- `apps/web/src/components/forms/danger-verb.tsx` (wraps
  `PressableFeedback.HoldConfirm` + `ConfirmDialog`).
- `HoverCard` composites per referenced entity in
  `apps/web/src/components/refine/hover-cards/`.
- Per-module detail-page implementations under
  `apps/web/src/modules/<module>/pages/show.tsx`.

Estimated effort: 100 engineering days.

### Phase 4: Settings and command palette (3 to 4 weeks)

Modules touched: `settings` (new), `authenticated-layout`.

Components added:

- Full Settings module at `apps/web/src/modules/settings/*` (Appendix B).
- `apps/web/src/components/layout/settings-sidebar.tsx` (secondary sidebar).
- `apps/web/src/components/layout/settings-page.tsx` (Section pattern).
- `apps/web/src/modules/settings/schema.ts` (typed schema).
- `apps/web/src/modules/settings/sections/*.tsx` (one file per section).
- Global `apps/web/src/components/command/command-palette.tsx` mounted in
  `authenticated-layout.tsx`.
- Module-level `commands.ts` under each module contributing to the palette.

Estimated effort: 60 engineering days.

### Phase 5: Analytics, real-time, kiosk polish (3 to 4 weeks)

Modules touched: `reports`, `notifications`, `reception`, `messaging`,
`sports/attendance`.

Components added:

- `apps/web/src/modules/reports/pages/*` (index + detail with `FloatingToc`).
- `apps/web/src/lib/realtime/*` (SSE + WebSocket clients).
- Real-time sidebar badge integration.
- `apps/web/src/modules/sports/attendance/*` (Agenda primary + Batch review
  alternate).
- Reception kiosk with `pin-lock` and `pattern-lock` flows.
- Messaging thread pane with `ChatConversation` real-time updates.

Estimated effort: 60 engineering days.

### Cross-phase concerns

Every phase ships:

- English strings in `messages/en.json` and page content in
  `public/data/en/*.json`.
- Arabic translations in `messages/ar.json` and `public/data/ar/*.json`, gated
  behind a translator review.
- Storybook stories for every new composite component under
  `packages/ui/src/react/components/*/stories/`.
- Unit tests for every new hook and pure helper.
- Integration tests for every new route.
- Screenshot tests (with playwright) for every new page in light and dark
  themes, LTR and RTL.

---

## 17. Open questions

Every ambiguity that surfaced while writing this plan is listed here, phrased as
a decision for a product owner. Each item cites the section it belongs to.
Nothing else in the plan is speculative; if it is not decided here or above, it
is a downstream product decision.

Sidebar and shell:

1. Grouping order. Is
   `Overview → Operations → Growth → Finance → Administration → AI` the right
   group order, or should Growth come after Finance? Section 3.1.
2. Group definitions per tenant type. Should `sports/*` submodules be nested
   inside a `Sports` group at the sidebar level, or promoted to top-level items?
   Section 3.1.
3. Tenant-configurable sidebar. Should tenants be able to reorder or hide
   sidebar groups from Settings, or is that a per-user preference? Section 3.1.
4. Secondary sidebar on tablet. Should `/settings/*` render its secondary
   sidebar as a `Segment`, `Tabs`, or a collapsible drawer at 768 pixels?
   Section 3.2.
5. Search field placement. Should the global search trigger sit in the middle of
   the navbar or on the left near the scope switchers? Section 3.3.
6. Region switcher visibility. Only visible when the tenant has at least two
   regions, or always visible with a `Global` option when regions are enabled?
   Section 3.3.

Overview page:

7. Analytics view mechanism. Is `Analytics` a saved layout preset (Section 4.4)
   or a hard-coded second view driven by `?view=analytics`? Section 4.7.
8. Widget definitions ownership. Should widget definitions live centrally in
   `apps/web/src/modules/dashboard/widgets.catalogue.ts` or be federated to each
   feature module via `AppModule.dashboardWidgets`? Section 4.5.
9. Widget resize behaviour. Should widgets be freely resizable by the user, or
   restricted to preset sizes (1x1, 2x1, 2x2, 3x2)? Section 4.2.
10. Layout-per-role auto-apply. Should the initial layout for a new user default
    to their primary role (owner sees Owner view, coach sees Coach view)
    automatically, or should the user pick? Section 4.4.
11. Onboarding checklist visibility. Should the checklist widget be shown by
    default to every user, or only to workspace owners? Section 4.6.
12. Onboarding step ownership. Who is responsible for completing each step - the
    workspace owner, or the role most likely to interact with the module (e.g.
    finance owner enables payments)? Section 4.6.
13. Onboarding completion detection. Some steps are boolean
    (`workspace_name is set`), others are count-based (`at least one athlete`),
    and others are visit-based (`user has visited /reports`). Is visit-based
    acceptable for `Explore reports`, or should it require a specific
    interaction (opening a template)? Section 4.6.

Listings:

14. DataGrid density default. Is compact density (`size="sm"`) the right default
    for every listing, or should each module opt in? Section 5.1.
15. Column width persistence granularity. Per-user, per-user-per-tenant, or
    per-user-per-resource? Section 5.2.
16. Bulk verb ordering. Should bulk verbs render in the order defined in the
    module, or a canonical order (Edit → Export → Archive → Delete)? Section
    5.4.
17. Merge-teams follow-up. What does the follow-up confirmation for
    `Merge teams` look like - a preview of the merged roster, or a full
    FocusModal to resolve conflicts? Section 5.4.
18. Kanban primary vs alternate. For `leads`, we recommend Kanban as primary.
    For `admin/approvals` and `safeguarding`, is Kanban the right primary, or
    does the DataGrid stay primary with Kanban as an alternate? Section 5.7.

Detail pages:

19. Tab visibility per permission. Should tabs that the user cannot view (e.g.
    `Payments` for a coach without `payments.view`) be hidden entirely, or shown
    disabled with a lock icon? Section 6.1.
20. HoverCard delay. Is HeroUI Pro's default 700-millisecond open delay right
    for reference previews inside dense tables, or is 300 milliseconds more
    usable? Section 6.2.
21. Sticky detail header. Should the detail-page header stick on scroll, or
    scroll away? Section 6.1.

Forms:

22. Full-page form and sidebar. Does HeroUI Pro's `AppLayout` support hiding the
    sidebar per-route today? If not, we need a wrapper that renders full-page
    flows outside the shell. Section 7.1.
23. FocusModal on mobile. FocusModal is designed for desktop focus. On phone,
    does it degrade to a full-screen route, or to a Sheet? Section 7.1.
24. Hold-confirm duration overrides. Is 2000 milliseconds sufficient for
    `Delete athlete`, or should it be 4000 for records tied to money? Section
    7.4.
25. Typed confirmation format. For tenant-scale actions, is `PURGE` the right
    typed confirmation phrase (uppercase, single word), or should it be
    `type the workspace slug`? Section 9.6.
26. Optimistic mutation coverage. Which verbs should stay pessimistic
    (server-first)? The plan proposes money verbs; is `sports/registrations`
    approval also pessimistic? Section 7.5.

Attendance:

27. Agenda vs DataGrid default. The plan recommends Agenda as primary for
    `sports/attendance`. Is this the right default for every tenant, or should
    tenants choose in Settings? Section 8.
28. Coach live-editing conflicts. When two coaches take attendance on the same
    session simultaneously, how does the UI resolve conflicts? Section 8.

Settings:

29. Scope enablement. Should regions be opt-in per tenant, opt-in per plan tier,
    or on by default? Section 9.5.
30. Currency at branch. Should currency be overridable per branch, or only per
    region? The plan recommends per-branch; is that too much variance to
    reconcile at reporting time? Section 9.5.
31. Language at user. Should the user's language override be persistent (in
    `settings.user.language`) or per-session? Section 9.5.
32. Feature flag rollout. Should feature flags support percentage rollout
    (`{ rollout_percent: 25 }`), or only boolean? Section 9.3.
33. Terminology depth. Should terminology overrides cover only singular and
    plural nouns, or also verbs (e.g. `Enroll` vs `Register`)? Section 9.3.
34. Retention floor. Is there a floor below which retention cannot be set (e.g.
    `attendance` cannot be less than 365 days)? Section 9.3.
35. Data region migration. Can a tenant move
    `settings.data_retention.data_region` after initial setup, or is that a
    support-only operation? Section 9.3.
36. Attribute types. Are the six attribute types (`text`, `number`, `select`,
    `date`, `boolean`) sufficient, or do we need `email`, `url`, `phone`,
    `money` as first-class? Section 9.3.
37. API-key scoping. Should API keys be scoped by resource (`athletes.viewAny`)
    or by verb (`GET /api/athletes`)? Section 9.3.
38. Webhook secret rotation. Should webhook secret rotation invalidate the old
    secret immediately or after a grace period? Section 9.3.

Notifications and real-time:

39. Notification transport. Is SSE the right default for read-only badges, and
    WebSocket for interactive modules, or should we standardise on WebSocket
    everywhere? Section 11.3.
40. Notification opt-out. Can users opt out of tenant-wide announcements, or
    only per-category? Section 9.3.
41. Toast stacking. When multiple toasts fire in quick succession, do we stack
    them or replace? Section 11.1.

Command palette:

42. Palette scope switching. Should the palette respect the current working
    scope (create-a-session in the current branch) by default, or offer a scope
    selector inside the create flow? Section 12.
43. ~~Palette shortcuts customisation. Are the `G X` / `N X` shortcuts fixed, or
    can users remap them? Section 12.~~ **Resolved.** Sequences are declared at
    the metadata layer (`AppResourceMeta.shortcuts` on each module manifest),
    aggregated by the module registry at boot, and validated for uniqueness with
    a dev-time `console.warn` on collisions. The action identity
    (`resourceName` + `action`) is the stable primary key; a future
    user-preference remap can override the sequence string without touching the
    module code or breaking saved layouts. See Section 13.2.

Accessibility and i18n:

44. Arabic terminology defaults. Do we ship Arabic terminology defaults for
    `athletes`, `coaches`, `teams`, etc., or leave them empty for tenants to
    fill in? Section 13.1.
45. Number script. In Arabic locales, do we render Western Arabic digits (0-9)
    or Eastern Arabic digits (٠-٩) by default? Section 13.1.
46. Keyboard shortcuts in RTL. Should `Ctrl B` still toggle the sidebar (which
    is on the right in RTL), or should it map to the same physical direction?
    Section 13.2.

Performance:

47. Virtualization threshold. Is 200 rows the right threshold, or should it
    depend on row density? Section 14.1.
48. Query staleTime for KPIs. Is 60 seconds too aggressive for KPI staleness in
    a tenant with high write throughput? Section 14.2.
49. Bundle size budget. Do we have a specific budget per page (e.g. under 200 KB
    gzipped for the overview)? Section 14.3.

Design tokens:

50. Sport colour palette. Should tenants pick per-sport colours, or should we
    ship a curated palette that tenants pick from? Section 15.
51. Role-role colour overlap. When a user has multiple roles, which role colour
    wins? Section 15.

Roadmap:

52. Phase ordering. Is the phased order
    (`Overview → Listings → Details → Settings → Analytics`) the right sequence,
    or should Settings ship earlier so tenants can self-configure? Section 16.
53. Beta cohorts. Do we roll each phase to a beta cohort before general
    availability? Section 16.

---

## 18. Appendix A: Component-to-module cross reference

The table below is a dense reference from HeroUI component to Academorix module.
Rows are components; columns are modules. A cell is marked `X` when the module
uses the component prominently, `.` when the module uses it incidentally, and
empty when it is not used. The intent is not full coverage; it is to help
engineers know which modules the change touches when they modify a shared
component.

Legend:

- `X` primary usage
- `.` secondary or supporting usage
- empty not used

| Component           | dashboard | leads | payments | memberships | passes | expenses | billing | entitlements | branches | regions | facilities | integrations | announcements | messaging | notifications | documents | people | staff | users | access | admin | attributes | credentials | offline-sync | organization | public-site | reception | reports | safeguarding | workspace | ai  | sports/athletes | sports/teams | sports/sessions | sports/matches | sports/events | sports/training | sports/attendance | sports/registrations | sports/awards | sports/coaching | sports/competition | sports/development | sports/drills | sports/formations | sports/medical | sports/performance | sports/progress | sports/registry | sports/seasons |
| ------------------- | --------- | ----- | -------- | ----------- | ------ | -------- | ------- | ------------ | -------- | ------- | ---------- | ------------ | ------------- | --------- | ------------- | --------- | ------ | ----- | ----- | ------ | ----- | ---------- | ----------- | ------------ | ------------ | ----------- | --------- | ------- | ------------ | --------- | --- | --------------- | ------------ | --------------- | -------------- | ------------- | --------------- | ----------------- | -------------------- | ------------- | --------------- | ------------------ | ------------------ | ------------- | ----------------- | -------------- | ------------------ | --------------- | --------------- | -------------- |
| DataGrid            | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | X            | .            | .           | X         | X       | X            | .         | .   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| ActionBar           | .         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | .           | X         | X       | X            | .         | .   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| KPI                 | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | .            | X             | X         | X             | X         | .      | X     | X     | .      | X     | .          | X           | .            | .            | .           | X         | X       | X            | .         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| KPIGroup            | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | .            | X             | X         | X             | X         | .      | X     | X     | .      | X     | .          | X           | .            | .            | .           | X         | X       | X            | .         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| Widget              | X         | .     | X        | .           | .      | .        | .       | .            | .        | .       | .          | .            | .             | .         | .             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | .         | X       | .            | .         | X   | X               | X            | X               | X              | X             | .               | X                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | X                  | .               | .               | .              |
| Agenda              | X         | .     | .        | .           | .      | .        | .       | .            | .        | .       | X          | .            | .             | .         | .             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | .         | .       | .            | .         | .   | X               | X            | X               | X              | X             | X               | X                 | .                    | X             | X               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | X              |
| Kanban              | .         | X     | .        | .           | .      | .        | .       | .            | .        | .       | .          | .            | X             | .         | .             | .         | .      | .     | .     | .      | X     | .          | .           | .            | .            | .           | .         | .       | X            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| HoverCard           | .         | X     | X        | X           | X      | X        | X       | X            | X        | .       | X          | .            | X             | X         | X             | X         | X      | X     | X     | .      | .     | .          | X           | .            | .            | .           | X         | .       | X            | .         | .   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| Command             | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| PressableFeedback   | .         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | .             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | .           | X         | .       | X            | X         | .   | X               | X            | X               | X              | X             | .               | X                 | X                    | X             | X               | X                  | .                  | X             | .                 | X              | X                  | .               | .               | X              |
| CheckboxButtonGroup | X         | X     | .        | .           | .      | .        | .       | .            | .        | .       | .          | X            | X             | .         | X             | X         | X      | X     | X     | X      | .     | X          | .           | .            | .            | .           | .         | .       | X            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| CellSelect          | X         | .     | .        | .           | .      | .        | .       | .            | .        | X       | .          | .            | .             | .         | X             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | X         | .       | .            | X         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| Timeline            | .         | X     | X        | X           | .      | X        | .       | .            | .        | .       | .          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | .           | X         | .       | X            | .         | X   | X               | X            | X               | X              | X             | .               | X                 | X                    | .             | X               | .                  | .                  | .             | .                 | X              | X                  | X               | .               | X              |
| EmptyState          | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | X            | X            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| MoneyAmountCell     | X         | .     | X        | X           | X      | X        | X       | X            | .        | .       | .          | .            | .             | .         | .             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | .         | X       | .            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | X                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | X               | .              |
| StatusBadge         | .         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | X            | .            | X           | X         | X       | X            | X         | .   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| FocusModal          | .         | X     | X        | X           | X      | X        | X       | .            | X        | X       | X          | X            | X             | X         | .             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| ProgressAccordion   | .         | X     | X        | X           | X      | X        | X       | .            | X        | X       | X          | X            | X             | .         | .             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| ProgressTabs        | .         | X     | X        | X           | X      | X        | X       | .            | X        | X       | X          | X            | X             | X         | .             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| PhoneInput          | .         | X     | .        | .           | .      | .        | X       | .            | .        | .       | .          | .            | .             | X         | .             | .         | X      | X     | X     | .      | .     | .          | .           | .            | .            | .           | X         | .       | X            | .         | .   | X               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | X              | .                  | .               | .               | .              |
| PinLock             | .         | .     | .        | .           | .      | .        | .       | .            | .        | .       | .          | .            | .             | .         | .             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | X         | .       | .            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| PatternLock         | .         | .     | .        | .           | .      | .        | .       | .            | .        | .       | .          | .            | .             | .         | .             | .         | .      | .     | .     | .      | .     | .          | .           | .            | .            | .           | X         | .       | .            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| JsonViewSection     | .         | .     | X        | .           | .      | .        | .       | .            | .        | .       | .          | X            | .             | .         | .             | .         | .      | .     | .     | X      | X     | X          | .           | .            | .            | .           | .         | .       | .            | .         | .   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | .               | .               | .              |
| ConfirmDialog       | .         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | .            | .            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| RichTextEditor      | .         | X     | .        | .           | .      | .        | .       | .            | .        | .       | .          | .            | X             | X         | .             | X         | .      | .     | .     | .      | .     | .          | .           | .            | .            | X           | .         | .       | X            | .         | X   | .               | .            | .               | .              | .             | .               | .                 | .                    | .             | .               | .                  | .                  | .             | .                 | .              | .                  | X               | .               | .              |
| FileUpload          | .         | .     | .        | .           | .      | X        | .       | .            | .        | .       | .          | X            | X             | X         | .             | X         | X      | X     | X     | .      | .     | .          | X           | .            | .            | X           | .         | .       | X            | .         | .   | X               | .            | .               | .              | .             | .               | .                 | .                    | X             | .               | .                  | .                  | .             | .                 | X              | .                  | .               | .               | .              |
| InlineTip           | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | X            | X            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| SectionContainer    | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | X            | X             | X         | X             | X         | X      | X     | X     | X      | X     | X          | X           | .            | X            | X           | X         | X       | X            | X         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |
| NumberValue         | X         | X     | X        | X           | X      | X        | X       | X            | X        | X       | X          | .            | X             | .         | X             | .         | .      | X     | .     | .      | X     | .          | X           | .            | .            | .           | X         | X       | .            | .         | X   | X               | X            | X               | X              | X             | X               | X                 | X                    | X             | X               | X                  | X                  | X             | X                 | X              | X                  | X               | X               | X              |

The `settings` module is not listed as a column because every component is used
in some section; it is easier to treat it as a superset.

---

## 19. Appendix B: Settings module folder layout

Proposed folder structure for `apps/web/src/modules/settings/`:

```
apps/web/src/modules/settings/
├── settings.module.tsx                 Module manifest (AppModule)
├── settings.types.ts                   Shared TypeScript types (SettingsSchema, section IDs)
├── schema.ts                           Full typed schema (Section 9.3)
├── defaults.ts                         Default values for every setting
├── permissions.ts                      Permission → section mapping
├── layout/
│   ├── settings-layout.tsx             Secondary sidebar shell (renders SettingsSidebar + Outlet)
│   ├── settings-sidebar.tsx            Secondary sidebar (Sidebar with grouped items)
│   ├── settings-header.tsx             Breadcrumbs + page title + save chip
│   └── settings-mobile-drawer.tsx      Mobile alternative to the sidebar
├── pages/
│   ├── redirect.tsx                    Redirects /settings to /settings/general
│   ├── general.tsx                     General section
│   ├── branding.tsx                    Branding section
│   ├── locale.tsx                      Locale and region section
│   ├── language.tsx                    Language section
│   ├── currency.tsx                    Currency and tax section
│   ├── sports.tsx                      Sports catalogue section
│   ├── notifications.tsx               Notifications section
│   ├── safeguarding.tsx                Safeguarding section
│   ├── billing.tsx                     Billing and subscription section
│   ├── integrations.tsx                Integrations section
│   ├── api-keys.tsx                    API keys section
│   ├── webhooks.tsx                    Webhooks section
│   ├── feature-flags.tsx               Feature flags section
│   ├── attributes.tsx                  Attributes section
│   ├── data.tsx                        Data and retention section
│   └── danger.tsx                      Danger zone section
├── components/
│   ├── setting-row.tsx                 Wraps CellSelect / CellSwitch / CellSlider / TextField with a label and description
│   ├── setting-row-group.tsx           Groups related rows inside a SectionContainer
│   ├── inherited-chip.tsx              Chip shown next to inherited settings
│   ├── override-button.tsx             Promotes an inherited setting to explicit
│   ├── reset-button.tsx                Demotes an explicit setting back to inherited
│   ├── save-indicator.tsx              "Saving..." / "Saved" chip
│   ├── scope-badge.tsx                 Chip showing the effective scope (tenant / region / branch / user)
│   ├── section-hero.tsx                Section title with icon, description, and metadata chips
│   ├── danger-verb-button.tsx          PressableFeedback.HoldConfirm-wrapped danger button
│   └── typed-confirmation-dialog.tsx   ConfirmDialog with a typed confirmation input
├── forms/
│   ├── use-settings-form.ts            Hook wrapping useForm with per-scope save
│   ├── use-inheritance.ts              Hook resolving the effective value from the inheritance chain
│   ├── use-permission.ts               Hook checking per-section permissions
│   ├── section-schema.ts               Per-section field metadata (types, defaults, permissions)
│   └── validators.ts                   Shared validators (URLs, emails, currency codes, timezone IDs)
├── hooks/
│   ├── use-active-scope.ts             Reads the active scope for Settings context
│   ├── use-settings-query.ts           Reads a merged settings value across scopes
│   ├── use-settings-mutation.ts        Writes a setting at a specific scope
│   └── use-audit-log.ts                Reads audit events for a specific setting key
├── data/
│   ├── currency-codes.ts               ISO 4217 currency list
│   ├── timezones.ts                    IANA timezone list
│   ├── languages.ts                    Enabled language list
│   ├── country-codes.ts                ISO 3166-1 alpha-2 country list
│   └── tax-jurisdictions.ts            Curated tax jurisdiction list
├── types/
│   ├── tenant.ts                       TenantSettings type
│   ├── region.ts                       RegionSettings type
│   ├── branch.ts                       BranchSettings type
│   └── user.ts                         UserSettings type
├── i18n/
│   └── keys.ts                         i18n keys used by every section
└── index.ts                            Barrel exports
```

Route wiring inside `settings.module.tsx`:

```ts
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SettingsLayout = lazy(() => import("./layout/settings-layout"));
const SettingsRedirect = lazy(() => import("./pages/redirect"));
const GeneralPage = lazy(() => import("./pages/general"));
const BrandingPage = lazy(() => import("./pages/branding"));
const LocalePage = lazy(() => import("./pages/locale"));
const LanguagePage = lazy(() => import("./pages/language"));
const CurrencyPage = lazy(() => import("./pages/currency"));
const SportsPage = lazy(() => import("./pages/sports"));
const NotificationsPage = lazy(() => import("./pages/notifications"));
const SafeguardingPage = lazy(() => import("./pages/safeguarding"));
const BillingPage = lazy(() => import("./pages/billing"));
const IntegrationsPage = lazy(() => import("./pages/integrations"));
const ApiKeysPage = lazy(() => import("./pages/api-keys"));
const WebhooksPage = lazy(() => import("./pages/webhooks"));
const FeatureFlagsPage = lazy(() => import("./pages/feature-flags"));
const AttributesPage = lazy(() => import("./pages/attributes"));
const DataPage = lazy(() => import("./pages/data"));
const DangerPage = lazy(() => import("./pages/danger"));

const settingsModule: AppModule = {
  name: "settings",
  resources: [
    {
      name: "settings",
      list: "/settings",
      meta: {
        label: "Settings",
        icon: Cog6ToothIcon,
        featureKey: "settings",
        requiredPermission: "settings.viewAny",
        order: 100,
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/settings",
      element: createElement(SettingsLayout),
    },
    {
      tier: "protected",
      path: "/settings",
      index: true,
      element: createElement(SettingsRedirect),
    },
    {
      tier: "protected",
      path: "/settings/general",
      element: createElement(GeneralPage),
    },
    {
      tier: "protected",
      path: "/settings/branding",
      element: createElement(BrandingPage),
    },
    {
      tier: "protected",
      path: "/settings/locale",
      element: createElement(LocalePage),
    },
    {
      tier: "protected",
      path: "/settings/language",
      element: createElement(LanguagePage),
    },
    {
      tier: "protected",
      path: "/settings/currency",
      element: createElement(CurrencyPage),
    },
    {
      tier: "protected",
      path: "/settings/sports",
      element: createElement(SportsPage),
    },
    {
      tier: "protected",
      path: "/settings/notifications",
      element: createElement(NotificationsPage),
    },
    {
      tier: "protected",
      path: "/settings/safeguarding",
      element: createElement(SafeguardingPage),
    },
    {
      tier: "protected",
      path: "/settings/billing",
      element: createElement(BillingPage),
    },
    {
      tier: "protected",
      path: "/settings/integrations",
      element: createElement(IntegrationsPage),
    },
    {
      tier: "protected",
      path: "/settings/api-keys",
      element: createElement(ApiKeysPage),
    },
    {
      tier: "protected",
      path: "/settings/webhooks",
      element: createElement(WebhooksPage),
    },
    {
      tier: "protected",
      path: "/settings/feature-flags",
      element: createElement(FeatureFlagsPage),
    },
    {
      tier: "protected",
      path: "/settings/attributes",
      element: createElement(AttributesPage),
    },
    {
      tier: "protected",
      path: "/settings/data",
      element: createElement(DataPage),
    },
    {
      tier: "protected",
      path: "/settings/danger",
      element: createElement(DangerPage),
    },
  ],
};

export default settingsModule;
```

Secondary sidebar (`settings-sidebar.tsx`) skeleton:

```tsx
import { AcademicCapIcon, Cog6ToothIcon } from "@academorix/ui/icons/outline";
import { Sidebar } from "@academorix/ui/react";
import { useLocation } from "react-router";

import type { ReactNode } from "react";

const GROUPS: {
  title: string;
  items: { id: string; label: string; route: string; icon: string }[];
}[] = [
  {
    title: "Workspace",
    items: [
      {
        id: "general",
        label: "General",
        route: "/settings/general",
        icon: "adjustments",
      },
      {
        id: "branding",
        label: "Branding",
        route: "/settings/branding",
        icon: "paint-brush",
      },
      {
        id: "locale",
        label: "Locale and region",
        route: "/settings/locale",
        icon: "globe",
      },
      {
        id: "language",
        label: "Language",
        route: "/settings/language",
        icon: "language",
      },
      {
        id: "currency",
        label: "Currency and tax",
        route: "/settings/currency",
        icon: "banknotes",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        id: "sports",
        label: "Sports catalogue",
        route: "/settings/sports",
        icon: "trophy",
      },
      {
        id: "notifications",
        label: "Notifications",
        route: "/settings/notifications",
        icon: "bell",
      },
      {
        id: "safeguarding",
        label: "Safeguarding",
        route: "/settings/safeguarding",
        icon: "shield",
      },
      {
        id: "attributes",
        label: "Attributes",
        route: "/settings/attributes",
        icon: "tag",
      },
    ],
  },
  {
    title: "Money",
    items: [
      {
        id: "billing",
        label: "Billing and subscription",
        route: "/settings/billing",
        icon: "credit-card",
      },
    ],
  },
  {
    title: "Extend",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        route: "/settings/integrations",
        icon: "plug",
      },
      {
        id: "api-keys",
        label: "API keys",
        route: "/settings/api-keys",
        icon: "key",
      },
      {
        id: "webhooks",
        label: "Webhooks",
        route: "/settings/webhooks",
        icon: "arrow-path",
      },
      {
        id: "feature-flags",
        label: "Feature flags",
        route: "/settings/feature-flags",
        icon: "flag",
      },
    ],
  },
  {
    title: "Advanced",
    items: [
      {
        id: "data",
        label: "Data and retention",
        route: "/settings/data",
        icon: "archive",
      },
    ],
  },
  {
    title: "Danger",
    items: [
      {
        id: "danger",
        label: "Danger zone",
        route: "/settings/danger",
        icon: "exclamation",
      },
    ],
  },
];

export function SettingsSidebar(): ReactNode {
  const { pathname } = useLocation();

  return (
    <Sidebar>
      <Sidebar.Content>
        {GROUPS.map((group) => (
          <Sidebar.Group key={group.title}>
            <Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
            <Sidebar.Menu>
              {group.items.map((item) => (
                <Sidebar.MenuItem
                  key={item.id}
                  id={item.id}
                  href={item.route}
                  isCurrent={pathname === item.route}
                >
                  <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>
    </Sidebar>
  );
}
```

Layout wrapper (`settings-layout.tsx`) skeleton:

```tsx
import { Outlet } from "react-router";

import type { ReactNode } from "react";

import { SettingsHeader } from "./settings-header";
import { SettingsSidebar } from "./settings-sidebar";

export default function SettingsLayout(): ReactNode {
  return (
    <div className="grid h-full min-h-0 grid-cols-[240px_minmax(0,1fr)] gap-0">
      <aside className="border-r border-border">
        <SettingsSidebar />
      </aside>
      <main className="flex min-h-0 flex-col overflow-y-auto">
        <SettingsHeader />
        <Outlet />
      </main>
    </div>
  );
}
```

Setting row (`setting-row.tsx`) skeleton:

```tsx
import { CellSelect, Description, Label } from "@academorix/ui/react";

import type { Key, ReactNode } from "react";

import { InheritedChip } from "./inherited-chip";
import { OverrideButton } from "./override-button";
import { ResetButton } from "./reset-button";
import { ScopeBadge } from "./scope-badge";

export interface SettingRowProps<T> {
  label: string;
  description?: string;
  scope: "tenant" | "region" | "branch" | "user";
  isInherited: boolean;
  inheritedFrom?: "tenant" | "region" | "branch";
  value: T;
  onChange: (value: T) => void;
  renderControl: (props: {
    value: T;
    onChange: (value: T) => void;
  }) => ReactNode;
}

export function SettingRow<T>({
  label,
  description,
  scope,
  isInherited,
  inheritedFrom,
  value,
  onChange,
  renderControl,
}: SettingRowProps<T>): ReactNode {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          <ScopeBadge scope={scope} />
          {isInherited ? <InheritedChip from={inheritedFrom!} /> : null}
        </div>
        {description ? (
          <Description className="text-xs text-muted">
            {description}
          </Description>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {renderControl({ value, onChange })}
        {isInherited ? (
          <OverrideButton onOverride={() => onChange(value)} />
        ) : (
          <ResetButton onReset={() => onChange(value)} />
        )}
      </div>
    </div>
  );
}
```

The above skeletons are indicative, not final. They document the wiring so an
engineer picking up Phase 4 can begin without re-designing the structure.

---

## 20. Appendix C: Detailed patterns and expansions

This appendix expands on patterns that appear briefly earlier in the document.
It is not new material; it is more detail on the same topics for engineers
picking up specific slices.

### 20.1 Sidebar grouping reference implementation

The primary sidebar grouping described in Section 3.1 is implemented by
extending the existing `useNavEntries` hook in `authenticated-layout.tsx`. The
extension groups `NavEntry` records by their module's `groupKey` (a new optional
field on `AppResourceMeta`).

```ts
export interface AppResourceMeta {
  label: string;
  icon?: IconType;
  featureKey?: string;
  requiredPermission?: string;
  parent?: string;
  order?: number;
  scopedBy?: ScopeDimension[];
  dataProviderName?: string;
  // Added by this plan:
  groupKey?:
    "overview" | "operations" | "growth" | "finance" | "administration" | "ai";
}
```

Each module manifest declares its `groupKey`:

```ts
// modules/leads/leads.module.tsx
const leadsModule: AppModule = {
  name: "leads",
  resources: [
    {
      name: "leads",
      list: "/leads",
      // ...
      meta: {
        label: "Leads",
        icon: UserPlusIcon,
        featureKey: "leads",
        requiredPermission: "leads.viewAny",
        order: 44,
        groupKey: "growth",
      },
    },
  ],
  // ...
};
```

The sidebar renderer then groups entries and orders groups in the canonical
order:

```ts
const GROUP_ORDER: NonNullable<AppResourceMeta["groupKey"]>[] = [
  "overview",
  "operations",
  "growth",
  "finance",
  "administration",
  "ai",
];

const GROUP_LABEL: Record<string, string> = {
  overview: "Overview",
  operations: "Operations",
  growth: "Growth",
  finance: "Finance",
  administration: "Administration",
  ai: "AI",
};
```

Entries without a `groupKey` render in an implicit trailing group labelled
`Other`. The plan expects this group to be empty once every module manifest is
updated; the fallback exists so an in-flight PR does not break the sidebar.

Group collapse state is persisted per user via
`useLocalStorageState<Record<string, boolean>>("sidebar-groups")` on the
workspace slug. Users who prefer everything expanded pay a small measurement
cost on load; users who prefer everything collapsed get a cleaner first render.

### 20.2 Widget renderer contract

Every widget renderer implements the same contract, one function that receives
the widget's runtime context and returns a `ReactNode`. The context includes the
current scope, the user's identity, the widget's persisted configuration
(`config`), and a `queryClient` for eager data fetching.

```ts
export interface WidgetRendererContext {
  scope: Scope;
  identity: Identity;
  config: Record<string, unknown>;
  onConfigChange: (next: Record<string, unknown>) => void;
}

export type WidgetRenderer = (context: WidgetRendererContext) => ReactNode;
```

A minimal KPI widget:

```tsx
export const RevenueMonthToDateWidget: WidgetRenderer = () => {
  const { result, query } = useList({
    resource: "payments",
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: "paid_at", operator: "gte", value: startOfMonth() }],
  });

  const total = result.data?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <Widget>
      <Widget.Header>
        <Widget.Title>Revenue this month</Widget.Title>
      </Widget.Header>
      <Widget.Content>
        <KPI>
          <KPI.Content>
            <KPI.Value currency="USD" style="currency" value={total}>
              {query.isLoading ? <Skeleton className="h-8 w-24" /> : null}
            </KPI.Value>
            <KPI.Trend trend={total > 0 ? "up" : "neutral"}>0%</KPI.Trend>
          </KPI.Content>
        </KPI>
      </Widget.Content>
      <Widget.Footer>
        <Link href="/payments">View all payments</Link>
      </Widget.Footer>
    </Widget>
  );
};
```

Chart widgets follow the same contract, using the chart components inside
`Widget.Content`. Widgets that need per-user configuration (a date range, a
filter) render a small `Popover` triggered from `KPI.Actions` and persist
changes via `onConfigChange`.

### 20.3 KPI aggregation strategy

The dashboard has a naming convention for KPI aggregations. Every KPI reads from
one of three data paths:

1. Row count. `useList` with `pagination: { pageSize: 1 }` and read
   `result.total`. Cheap; used for `Athletes count`, `Active memberships`,
   `Open leads`. This is the current pattern in `dashboard-page.tsx`.

2. Aggregate endpoint. A dedicated `/api/<resource>/aggregate` endpoint
   returning `{ count, sum, avg, min, max, breakdown }` for a resource under the
   current scope filters. Used for `Revenue MTD`, `Attendance rate`,
   `Conversion rate`. The backend implements aggregates per module; the frontend
   calls `useOne` on a synthetic resource key like `athletes.aggregate`.

3. Precomputed cube. For historical trends (30-day rolling revenue, 90-day
   attendance), the backend materialises a cube keyed by (scope, resource, day)
   and the frontend reads it via `useList({ resource: "cube:payments-daily" })`.
   This avoids re-scanning the entire payments table for every user's overview.

Widgets pick a path based on cost. Simple widgets use row-count. Money widgets
use aggregate. Time-series widgets use cube.

### 20.4 Empty-state copy conventions

Empty-state copy is data. Every module's `emptyState` is a triple:
`{ title, description, primaryCta }`. Rules:

- Titles are noun-phrased and use the tenant's terminology (`No students yet`
  for an academy, `No members yet` for a club, `No athletes yet` for the
  default).
- Descriptions are two sentences. The first says why the state is empty. The
  second says what to do next.
- Primary CTAs are verb-phrased and identical to the top-right primary action on
  the listing (`Register athlete`, `Add coach`, `Schedule session`). If the
  listing has no create route, the CTA is empty and the empty state is
  informational only.

Bilingual empty states. English lives in `messages/en.json` at
`modules.<module>.emptyState`. Arabic lives in `messages/ar.json` at the same
key. The `EmptyState` composite reads these via `useTranslations` and falls back
to English if a key is missing.

### 20.5 Toast catalogue

Every mutation produces one of three toasts: success, warning, or error. The
plan does not enumerate every possible toast, but establishes copy patterns:

- Success: `<Verb> <target>`. `Created athlete Sara Al Zahra`.
  `Refunded $250 to Sara Al Zahra`.
  `Assigned coach Ali Hassan to Under-14 team`.
- Warning: `<Neutral verb> <target>, but <caveat>`.
  `Sent 47 invitations, but 3 failed`.
  `Approved 15 registrations, but 2 need medical clearance`.
- Error: `Could not <verb> <target>. <Reason.>`.
  `Could not delete athlete Sara Al Zahra. She is on 3 active teams; remove her from teams first.`

Every toast has an optional `actionLabel` and `onAction` (for Undo, Retry, or
View). Success toasts include `View` for a 4-second window. Error toasts include
`Retry` when the failure is transient (network, rate limit) and `Details` when
the failure is structural (validation, referential integrity).

### 20.6 Data-grid density modes

The plan proposes `compact` as the default density (`size="sm"` on `DataGrid`,
`text-xs` on cells, `py-1.5` on rows). Two other modes are available:

- Comfortable. `size="md"` on `DataGrid`, `text-sm` on cells, `py-2` on rows.
  Enabled per user via `Shift D` (Section 13.2) and persisted in
  `settings.user.datagrid_density = "comfortable"`.
- Cosy. `size="md"` with `verticalAlign="top"` and 72-pixel row height. Reserved
  for listings with multi-line rows (`sports/progress` notes, `safeguarding`
  case rows with descriptions). Modules opt in per resource.

The bridge exposes a `density` prop on `ResourceDataGrid` that maps to `size`
and `rowHeight` accordingly.

### 20.7 Detail-page tab persistence

The active tab on a detail page is persisted in the URL via a `?tab=` query
parameter. This makes tab state deep-linkable and preserves the tab across
refresh. The Tabs bridge reads and writes the parameter via `useSearchParams`.

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get("tab") ?? "overview";

<Tabs
  selectedKey={activeTab}
  onSelectionChange={(key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", String(key));
    setSearchParams(next);
  }}
>
  <Tabs.List>
    <Tabs.Item id="overview">Overview</Tabs.Item>
    <Tabs.Item id="attendance">Attendance</Tabs.Item>
    <Tabs.Item id="performance">Performance</Tabs.Item>
    <Tabs.Item id="medical">Medical</Tabs.Item>
    <Tabs.Item id="payments">Payments</Tabs.Item>
    <Tabs.Item id="documents">Documents</Tabs.Item>
    <Tabs.Item id="activity">Activity</Tabs.Item>
  </Tabs.List>
  {/* Tabs.Panel elements */}
</Tabs>;
```

### 20.8 Reception kiosk anatomy

The reception module lives at `/reception` and renders a full-height,
sidebar-hidden surface for shared kiosk usage. Its anatomy:

- Top bar: branch name (from active scope), current date and time, `Button` to
  switch branches (visible only to receptionists with cross-branch access).
- Central pane: `Segment` with three tabs - `Check in`, `Check out`,
  `Waiting list`.
- Check in pane: an `Autocomplete` for guardian or athlete name, a `PinLock` or
  `PatternLock` for guardian confirmation, and a
  `Button variant="primary" size="lg"` labelled `Check in` that fires the
  check-in mutation.
- Check out pane: a `ListView` of currently checked-in athletes, each row with a
  `PressableFeedback.HoldConfirm`-wrapped `Check out` button (2000-millisecond
  hold).
- Waiting list pane: athletes registered but not yet checked in for a scheduled
  session, sorted by session start time.
- Bottom bar: `Button variant="ghost"` labelled `Lock screen` that returns to
  the PIN or pattern prompt.

Kiosk security. Each branch has a `settings.branch.reception.pin_enabled` and
`settings.branch.reception.pattern_enabled` flag. Both can be enabled
simultaneously; the kiosk shows a `Segment` allowing the receptionist to pick
their unlock method. Individual users can set their personal PIN under
`settings.user.reception_shortcut`.

### 20.9 Messaging thread pane

The messaging module renders a two-pane layout at desktop width:

- Left pane: `ListView` of conversations grouped by `Unread`, `Assigned to me`,
  `All`. Each row is an avatar, name, message excerpt, timestamp, and unread
  badge.
- Right pane: `ChatConversation` from `@academorix/ui/react` with `ChatMessage`
  rows, a `PromptInput` at the bottom for composing, and a header row showing
  the recipient, their status, and a `Dropdown` for verbs (`Assign to staff`,
  `Close conversation`, `Mark unread`).

Real-time. New messages arrive via WebSocket (Section 11.3) and append to the
active conversation without user action. Unread counts on the left pane update
in-place. Toast fires on incoming messages when the app is not focused, with a
`View` action that opens the conversation.

Templates. Messaging supports templates stored under
`settings.tenant.messaging_templates`. The compose input has a slash-command
trigger (`/`) that inserts a template. Templates support Handlebars-style
variables (`{{athlete.name}}`, `{{session.start_at}}`) which resolve on send.

### 20.10 Multi-tenant scope model in detail

The dashboard supports a hierarchy of scopes:

- Organisation (tenant): the top-level entity, one workspace.
- Region: optional grouping of branches, enabled per tenant.
- Branch: physical or logical location.
- Season: time-bound container for sports operations.

Every resource declares its `scopedBy` in the module manifest. The bridge
(`buildScopeFilters`) reads the resource's `scopedBy` array and appends the
corresponding scope filters at query time. Example:

```ts
// modules/sports/athletes/athletes.module.tsx
const athletesModule: AppModule = {
  name: "sports/athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      // ...
      meta: {
        label: "Athletes",
        scopedBy: ["organization", "branch", "season"],
        // ...
      },
    },
  ],
  // ...
};
```

Cross-scope views. Users with `athletes.viewAny.cross-branch` can toggle a
`Cross-branch` view on the athletes listing that removes the branch filter. This
is opt-in per query, not per user, and the URL reflects the choice via
`?scope=cross-branch`.

### 20.11 Documents module folder tree

The documents module renders a hybrid layout. The primary view is a `DataGrid`
with `getChildren` for folder expansion. The secondary view is a `Resizable`
split with a `FileTree` on the left and a preview on the right.

Files are versioned. Each row exposes a `Version` column that opens a `Popover`
with the version history and a `Restore` action. Version rollback is not
destructive (the current version is preserved as a new version).

Access control on documents is defined per folder. `settings.tenant.attributes`
cannot introduce document-specific attributes; that lives inside the `documents`
module's own `document_permissions` collection.

### 20.12 AI module chat surface

The `/ai` module hosts an AI assistant conversation surface. Anatomy:

- Left pane (drawer on mobile): conversation history as a `ListView`.
- Right pane: active `ChatConversation` with `ChatMessage`, `ChatToolbar`,
  `ChatAttachment`, `ChainOfThought`, and `PromptInput`.
- Below the chat: `PromptSuggestion` chips for common tasks
  (`Summarise this week`, `Draft a team announcement`,
  `Analyse attendance drop`).

Actions. AI responses can include actionable buttons (`Register athlete`,
`Send announcement`) that pre-fill a form and open the corresponding create
flow.

Persistence. Conversations are stored per user under the current scope. Deleting
a conversation is a hold-confirm action; the record is soft-deleted and purged
after 30 days.

### 20.13 Notifications event catalogue

The notification events listed in Section 9.3 (`NotificationEventKey`) each have
a template. Example templates:

| Event key                | Title                 | Description                                                              | Icon                      |
| ------------------------ | --------------------- | ------------------------------------------------------------------------ | ------------------------- |
| `registration.new`       | New registration      | `{{athlete.name}} registered for {{sport.name}}`                         | `UserPlusIcon`            |
| `registration.approved`  | Registration approved | `{{athlete.name}}'s registration for {{sport.name}} has been approved`   | `CheckIcon`               |
| `registration.rejected`  | Registration rejected | `{{athlete.name}}'s registration was rejected`                           | `XMarkIcon`               |
| `payment.paid`           | Payment received      | `{{amount}} received from {{payer.name}} for invoice {{invoice.number}}` | `CreditCardIcon`          |
| `payment.overdue`        | Payment overdue       | `Invoice {{invoice.number}} for {{amount}} is overdue by {{days}} days`  | `ExclamationTriangleIcon` |
| `payment.refunded`       | Payment refunded      | `{{amount}} refunded to {{payer.name}}`                                  | `ArrowUturnLeftIcon`      |
| `attendance.absence`     | Absence recorded      | `{{athlete.name}} was marked absent for {{session.title}}`               | `MinusCircleIcon`         |
| `attendance.late`        | Late arrival          | `{{athlete.name}} arrived late to {{session.title}}`                     | `ClockIcon`               |
| `safeguarding.new`       | New safeguarding case | `Case {{case.number}} opened by {{reporter.name}}`                       | `ShieldExclamationIcon`   |
| `safeguarding.escalated` | Case escalated        | `Case {{case.number}} escalated to {{severity}}`                         | `ExclamationCircleIcon`   |
| `credential.expiring`    | Credential expiring   | `{{credential.name}} for {{holder.name}} expires in {{days}} days`       | `KeyIcon`                 |
| `credential.expired`     | Credential expired    | `{{credential.name}} for {{holder.name}} has expired`                    | `KeyIcon`                 |
| `session.cancelled`      | Session cancelled     | `{{session.title}} on {{session.date}} was cancelled`                    | `CalendarIcon`            |
| `session.reminder`       | Upcoming session      | `{{session.title}} starts in {{minutes}} minutes`                        | `BellIcon`                |
| `announcement.published` | New announcement      | `{{author.name}} published {{announcement.title}}`                       | `MegaphoneIcon`           |
| `lead.assigned`          | Lead assigned         | `{{lead.name}} was assigned to you`                                      | `UserPlusIcon`            |
| `lead.stage-changed`     | Lead stage changed    | `{{lead.name}} moved from {{from}} to {{to}}`                            | `ArrowRightIcon`          |

Every template supports Handlebars-style variables. Rendering happens on the
server; the client receives a resolved `title` and `description`. Localisation
happens at render time based on the recipient's `settings.user.language`.

### 20.14 Analytics widget query patterns

Analytics widgets need aggregations that row-count-based KPIs cannot express.
The plan uses three patterns:

1. Client-side aggregation. For small result sets (< 1000 rows), `useList` with
   the raw resource, then aggregate in `useMemo`. Suitable for `Lead sources`
   (fetch every lead, group by source in the client).

2. Server-side aggregation via a synthetic resource. For medium result sets,
   `useList({ resource: "athletes.aggregate", filters: [...] })` reads a
   purpose-built endpoint. Suitable for `Revenue MTD` (server sums by day).

3. Cube reads. For time-series,
   `useList({ resource: "cube:payments-daily", pagination: { pageSize: 90 } })`
   reads a materialised view. Suitable for `Revenue trend 90 days`.

The choice matters for scope invalidation. Client-side aggregation invalidates
when the underlying `useList` invalidates; server-side aggregates and cubes
invalidate on their own cache keys.

### 20.15 Filter and sort persistence

Every listing persists filter and sort state per user, per resource. The
`resource_views` mechanism (Section 5.6) covers this: an unnamed view named
`Current` is auto-saved whenever filters or sort change.

The user's active view is stored in `settings.user.active_views.<resource>`. On
listing load, the bridge reads this and applies the view. Users can pin a view
as their default via the saved-view menu.

### 20.16 Column-visibility persistence

Column visibility persists similarly, keyed by (user, resource) as
`settings.user.column_visibility.<resource>`. When a listing loads, the bridge
reads the persisted visibility and applies it to the DataGrid's `visibleColumns`
set.

New columns added by an engineer default to visible. Existing users get the new
column visible by default; they can hide it via the columns dropdown.

### 20.17 Bulk mutation implementation

Bulk mutations use Refine's `useUpdateMany`, `useDeleteMany`, and
`useCreateMany` where the backend supports them, and fall back to a client-side
loop otherwise. The bridge wraps this in a `useBulkMutation` hook that:

- Batches into chunks of 50.
- Shows progress in the ActionBar (a `ProgressCircle` inside
  `ActionBar.Prefix`).
- On completion, shows a summary toast (`Updated 47 records, 3 skipped`).
- On failure of a subset, shows a warning toast with a link to a details modal
  listing which records failed and why.

For long-running bulk operations (over 500 records, over 30 seconds), the
mutation is enqueued as a background job. The user receives a notification when
the job completes, and the ActionBar closes immediately.

### 20.18 Currency conversion at read time

Every money-related read goes through a currency-aware selector. When a widget
or KPI displays revenue and the user is scoped to a region with a different
currency from the underlying payments, the selector converts amounts at the
exchange rate configured in `settings.tenant.currency.exchange_rate_provider`.

Rules:

- Reads never mutate stored amounts. The stored amount and currency are always
  the record's originals.
- Conversions use the exchange rate on the record's paid-at date (historical
  fidelity), not the current rate.
- If the exchange rate is unavailable, the KPI shows a warning chip
  (`Data incomplete`) and displays the raw amounts by currency.

### 20.19 Timezone handling on Agenda

`Agenda` renders events in the effective timezone (user → branch → region →
tenant). Sessions stored in UTC render locally. When the user switches scope to
a branch in a different timezone, every event on the Agenda re-anchors to the
new timezone.

Coach view. Coaches typically work at a single branch; their effective timezone
matches. Owners viewing across branches see events in the tenant timezone; when
they drill into a session, the detail page shows both the tenant timezone and
the branch timezone (`Session starts at 18:00 branch time / 15:00 tenant time`).

### 20.20 Offline-sync module surface

The `offline-sync` module surfaces pending mutations from the offline queue in a
listing. Rows are queued mutations with columns: verb chip, target resource,
target ID, submitted-at, retries, and status. Bulk verbs are `Retry` and
`Discard`.

The queue itself is stored client-side in IndexedDB via the `@academorix/ui`
offline-queue hooks. When connectivity returns, mutations flush automatically.
The `offline-sync` module page is a diagnostic and manual-recovery surface, not
the primary sync mechanism.

The AppLayout also shows a `ConnectionIndicator` chip in the top bar when
connectivity is lost. Clicking the chip opens the `/offline-sync` module.

### 20.21 A note on chart palettes

Charts inside `Widget` use the HeroUI Pro chart palette (`--chart-1` through
`--chart-6`). Each Widget's `Widget.Legend` uses `Widget.LegendItem` with
`color="var(--chart-3)"` etc. Chart colours are semantic per-widget, not
per-tenant.

Sport-coloured charts. When a chart's series correspond to sports, use
`var(--color-sport-<key>)` (Section 15) instead of chart colours. This keeps the
visual language consistent between the Agenda (which uses sport colours per
event) and the analytics (which uses sport colours per series).

### 20.22 Progressive disclosure in forms

Long forms hide advanced sections behind `Disclosure` or `DisclosureGroup` from
`@heroui/react`. The pattern:

- Required fields are always visible at the top.
- Optional-but-common fields sit below required fields.
- Advanced fields (webhook secrets, retention overrides, feature-flag rollout
  percentages) hide behind a `Disclosure` labelled `Advanced settings`.

The disclosure state persists per form: expanding `Advanced settings` on athlete
create is remembered across sessions so power users do not re-expand it every
time.

### 20.23 Save-and-continue patterns

Multi-step forms in `progress-tabs` or `progress-accordion` auto-save on step
completion. The pattern:

- Step 1 completed → save a draft record with the fields entered so far.
- Step 2 completed → update the draft.
- Step N completed → the primary submit becomes enabled.

Draft records are visible in the listing with a `Draft` `StatusBadge`. Users can
leave and return; the form pre-fills from the draft. Discarding a draft is a
hold-confirm action.

### 20.24 The `attributes` module and custom fields

`attributes` defines custom fields at the tenant level. Every attribute is
defined once and applies to zero or more target resources (`athletes`, `leads`,
`staff`, etc.). When rendered on a form, custom attributes appear inside a
`Fieldset` labelled `Additional information` below the standard fields.

Custom-attribute rendering per type:

- `text`: `TextField`.
- `number`: `NumberField`.
- `select`: `Select` populated from the attribute's `options`.
- `date`: `DatePicker`.
- `boolean`: `Switch`.

Custom-attribute filtering. When a listing supports filtering, the attribute is
available as a filter dimension. Custom attributes surface alongside built-in
filters in the filters dropdown, marked with a `Custom` chip.

### 20.25 API-keys module UX

`/settings/api-keys` renders a DataGrid of the tenant's keys. Bulk verbs:
`Revoke`, `Rotate`, `Add scopes`, `Remove scopes`. The `Create key` action opens
a `FocusModal` with:

- Name (required).
- Scopes (`CheckboxButtonGroup` of resource-verb combinations).
- Expiry (`DatePicker`, optional).

On create, the modal returns a one-time-view of the full key with a
copy-to-clipboard button and a warning that the key is not stored server-side.
Closing the modal without copying is fine (the user can rotate the key); we do
not force interaction to close the modal.

### 20.26 Webhook detail page

Every webhook has a detail page under `/settings/webhooks/:id`:

- Header: webhook URL, active toggle, `PressableFeedback.HoldConfirm`-wrapped
  `Delete` button.
- Tabs: `Overview`, `Deliveries`, `Payload previews`.
- Deliveries tab: `DataGrid` of past deliveries with status chips, timestamps,
  and durations. Selecting a row opens a `Sheet` with the request headers,
  request payload (in `JsonViewSection`), response status, response headers, and
  response body.
- Payload previews tab: `JsonViewSection` showing an example payload for each
  subscribed event type.

Retry. Failed deliveries expose a `Retry` action in the row menu. Retries
respect exponential backoff and expose the next retry time in the row.

### 20.27 Feature-flag rollout UX

The feature-flags section renders a `DataGrid` of flags with columns: key,
description, tenant value, per-branch overrides count, rollout percent. Editing
a flag opens a `Drawer` with:

- A `Switch` for the tenant-level boolean.
- A `Slider` for the rollout percentage (0 to 100), disabled when the flag is a
  plain boolean.
- A `DataGrid` of branch overrides with add and remove actions.

The rollout percent applies per session, hashed by `(tenant, user, flag)`. This
is stable per user so a user who is in the treatment group stays in it across
sessions.

### 20.28 Data-retention purge preview

Purging a retention window is a two-step confirmation:

1. Preview: the user sees a `DataGrid` of records that would be deleted, grouped
   by resource, with counts.
2. Confirm: a `ConfirmDialog` with a typed confirmation (`PURGE`) and a
   `PressableFeedback.HoldConfirm` primary button.

The purge is asynchronous. Users receive a notification when the purge
completes. The audit log records who initiated the purge, when, and what.

### 20.29 Danger-zone workspace closure

Closing a workspace is the most consequential action in the dashboard. The flow:

1. User navigates to `/settings/danger` and clicks `Close workspace`.
2. A `ConfirmDialog` opens with:
   - A summary of what will happen (workspace suspended immediately, data
     retained for 30 days, permanent deletion after 30 days).
   - A `TextField` for the typed workspace slug.
   - A `PressableFeedback.HoldConfirm`-wrapped primary button labelled
     `Close workspace` with `duration={4000}`.
3. On confirmation, the workspace enters a suspended state. All users are signed
   out. The workspace can be restored by the owner within 30 days via
   `/api/workspaces/:id/restore`.
4. A recovery email is sent to the workspace owner with a restore link.

### 20.30 Onboarding checklist state machine

The onboarding checklist state per tenant is a small state machine:

- `initial`: no steps completed. Widget always visible.
- `in-progress`: at least one step completed. Widget visible unless hidden by
  the user.
- `complete`: every step completed. Widget dismissed and hidden until reset.
- `dismissed`: user manually dismissed. Widget hidden, resetting requires
  opening a modal from Settings → General.

Steps individually track:

- `completed`: predicate returns true.
- `skipped`: user clicked `Dismiss this step`.
- `not-started`: neither of the above.

Only `completed` and `skipped` count toward the progress percentage.

### 20.31 A note on the Refine data-provider abstraction

The dashboard uses two data providers: `default` (REST against the Academorix
backend) and `mock` (local fixtures for modules whose backend has not shipped).
The registry auto-applies `mock` for resources listed in
`BACKEND_READY_RESOURCES = ["athletes", "coaches", "teams", "events", ...]` (see
`providers/data`).

Modules should not set `dataProviderName` by hand; the registry handles it. When
a module's backend ships, the resource moves from `mock` to `default` by
removing it from the exclusion list in `providers/data`. This gives us the
freedom to build a full UX for a resource before the backend is ready, then flip
a switch when the API lands.

### 20.32 Refine identity, features, and permissions

The `Identity` type (from `@/types`) is the shape of the response from
`/auth/me`:

```ts
export interface Identity {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar_url: string | null;
  features: string[]; // e.g. ["leads", "safeguarding", "ai"]
  permissions: string[]; // e.g. ["athletes.viewAny", "*"] where "*" means superuser
  terminology?: Record<string, string>; // e.g. { "athletes": "Students" }
  scope: {
    organization_id: string;
    branch_id: string | null;
    region_id: string | null;
    season_id: string | null;
  };
  roles: string[]; // e.g. ["owner", "coach"]
}
```

The sidebar, the command palette, the widgets, and every listing gate on
`features` and `permissions`. The plan extends this by:

- Introducing `terminology` at the group level:
  `terminology["group:operations"] = "Operations"` for tenants that want to
  rename the sidebar group.
- Introducing `permissions.<verb>.<scope-suffix>` for cross-scope permissions:
  `athletes.viewAny.cross-branch` for network-scale reads.
- Introducing `roles` as a first-class field, exposed in the user avatar
  dropdown as chips (`Coach`, `Reception`, `Finance`).

### 20.33 Terminology overrides and forms

Terminology overrides do not apply just to the sidebar. Every form label, every
empty-state title, every KPI title respects the tenant's terminology. This is
implemented by wrapping every string that references a resource in
`useResourceLabel(resource, defaultLabel)`.

For sports-specific terminology (`Positions` vs `Roles`, `Fixtures` vs
`Matches`), the tenant can override terminology at the sport level via
`settings.tenant.terminology_by_sport.<sport-key>`.

### 20.34 The role of `people` vs `staff` vs `users`

Three modules touch identity: `people`, `staff`, `users`. Their
responsibilities:

- `users`. Everyone with a login. Manages authentication, roles, and
  permissions. Owned by workspace admins.
- `staff`. Employees, coaches, and contractors who work for the academy. Every
  staff row has a corresponding user row (usually). Owned by workspace admins
  and HR.
- `people`. A broader contact directory of guardians, prospects, and external
  contacts who do not necessarily have logins. Owned by admins and
  receptionists.

Overlap. A person can also be a user (e.g. a guardian who logs in to see their
child's schedule). A staff member is always a user; a person may or may not be.
The three modules link via foreign keys.

### 20.35 Roles vs permissions

The dashboard uses permissions for access decisions and roles for UX affordances
(which colour badge, which layout preset). Roles are not enforced; permissions
are.

Standard roles:

- `owner`. Full control over the workspace.
- `admin`. Full control except billing and workspace closure.
- `coach`. Sessions, attendance, performance, training.
- `receptionist`. Reception, check-ins, guardian communication.
- `finance`. Payments, expenses, billing.
- `safeguarding-officer`. Safeguarding cases only.
- `athlete`. Read-only access to their own record.
- `guardian`. Read-only access to their linked athletes.
- `viewer`. Read-only across the workspace.

Custom roles are defined per tenant with a specific permission set.

### 20.36 Multi-role users and layout picking

A user with multiple roles (owner + coach) sees the union of every permission.
The layout picker in the user avatar dropdown shows their roles as chips;
selecting a role reduces the UX affordances to that role (default landing route,
default dashboard layout, sidebar item ordering).

### 20.37 Attendance quick-taking flow

A common flow: a coach opens their tablet, taps today's session on the Agenda,
taps `Take attendance`, and marks 30 athletes present in under 30 seconds.

The flow:

1. Tap session on Agenda. A `FocusModal` opens.
2. `FocusModal.Body` renders a full-height DataGrid of athletes in the session's
   team, with columns: avatar, name, status (a `Segment` with `Present`, `Late`,
   `Absent`, `Excused`), notes.
3. `Segment` items are large touch targets (48-pixel height at least).
4. A `Button variant="primary" size="lg"` labelled `Mark all present` at the
   top; a `Save` button at the bottom.
5. On save, the mutation fires optimistically, the FocusModal closes, and the
   Agenda event's colour updates.

Offline. If connectivity is lost, the mutation is queued and the modal shows a
warning chip (`Saved locally; will sync when connection returns`).

### 20.38 The `/reports` search experience

The reports index has its own search field that indexes report titles, tags, and
descriptions. Searching filters the DataGrid of saved reports and the
ItemCardGroup of templates in parallel. Selecting a template opens a wizard (a
`progress-tabs` FocusModal) with steps: `Choose scope`, `Select filters`,
`Choose columns`, `Preview`, `Save`.

Report scheduling. Any saved report can be scheduled via a `Popover` from the
row menu. The popover has:

- Frequency (`Daily`, `Weekly`, `Monthly`).
- Time (`TimeField`).
- Recipients (`TagGroup` of email addresses or user IDs).
- Format (`Segment` with `CSV`, `PDF`, `Excel`).
- On/off toggle.

Scheduled reports fire notifications when they run and store the last-run status
on the report row.

### 20.39 Print and export

Every DataGrid supports CSV export via the toolbar. Detail pages support print
via the browser (`window.print()`) with a print stylesheet that hides the
sidebar, navbar, and side rail and expands the main content.

PDF export. Detail pages with a canonical PDF format (invoices, receipts,
safeguarding case reports) have a `Button variant="secondary"` labelled
`Download PDF` in the header dropdown. The PDF is generated server-side; the
button fires a request and downloads the result.

### 20.40 Accessibility validation checklist

The plan does not claim automatic WCAG compliance. Every new page ships with the
following manual checklist:

- Focus order matches visual reading order.
- Every interactive element has a visible focus indicator.
- Every non-decorative icon has an `aria-label` or is accompanied by text.
- Every colour-encoded state has a shape or text alternative (a `success` chip
  has a check icon).
- Every form field has a visible label and a description if the label is
  ambiguous.
- Every error message is associated with its field via `aria-describedby`.
- Every dynamic region announces to screen readers via `aria-live="polite"`
  (toasts, badge updates).
- Every drag-and-drop interaction has a keyboard alternative.
- Colour contrast passes 4.5:1 for text and 3:1 for large text and non-text
  against the theme's foreground and background tokens.

Screenshot tests capture light-mode and dark-mode renders; a manual pass
verifies the checklist above.

---
