# Academorix Dashboard — Menus Plan

> Status: **draft** · Last review: 2026-07 · Owner: platform team.
>
> How Academorix builds three related menu systems that stay in sync across web,
> PWA, and desktop:
>
> 1.  **Native application top-bar menu** (macOS-style menu bar) — Tauri only.
> 2.  **In-app top-bar menu** (workspace switcher, notifications, help, profile)
>     — web + PWA + desktop.
> 3.  **Right-click context menu** — everywhere. Row-level actions, cell copy,
>     bulk operations.

The three menu surfaces share ONE registry-driven design so a command is
authored once and appears in the right places automatically.

---

## 1. Guiding principles

- **Single registry, three renderers.** Every menu item is a `MenuCommand`
  object with an `id`, `label` (i18n key), `shortcut`, `execute()`, permission
  check, and visibility predicate. Renderers consume the same registry — no
  per-surface forking.
- **Native when we can, HeroUI when we can't.** Desktop uses OS-native menus
  (real menu bar, real accelerators). Web uses HeroUI Popover/Dropdown so the
  visual language matches the rest of the app.
- **Keyboard is first-class.** Every command exposes a shortcut sequence and
  routes through the same registry as the command palette
  (`lib/keyboard/registry.ts`).
- **Permission-aware.** A user without `athlete.create` never sees "New athlete"
  in ANY menu surface. No client-side render of items the backend would reject.
- **i18n + RTL clean.** Labels are message keys, submenus flip anchor sides in
  RTL, keyboard shortcuts show the OS-appropriate glyph (`⌘` on macOS, `Ctrl`
  elsewhere).

---

## 2. Command model

```ts
// src/menus/command.types.ts
export interface MenuCommand {
  /** Stable id — used as registry key + analytics event property. */
  id: string; // e.g. "athlete.create"

  /** i18n message key for the label. */
  labelKey: string; // e.g. "menus.athlete.create"

  /**
   * i18n key for optional secondary text (submenu tooltip / description
   * shown under the label in the command palette).
   */
  descriptionKey?: string;

  /** Keyboard sequence — same format as AppResourceShortcuts. */
  shortcut?: string; // e.g. "G N A" or "Cmd+K"

  /** Categorical grouping used by native menu bar + context menu grouping. */
  category: MenuCategory;

  /**
   * OPTIONAL icon component. Web renders it; native menu bar ignores it
   * (macOS/Windows menu items don't render icons in the app menu).
   */
  icon?: ComponentType<{ className?: string }>;

  /** Predicate that returns true if the command should be visible. */
  isVisible?: (ctx: MenuContext) => boolean;

  /** Backend permission required — checked BEFORE isVisible. */
  requires?: PermissionCode | PermissionCode[];

  /** The actual side-effect. Runs in the renderer thread. */
  execute: (ctx: MenuContext) => void | Promise<void>;

  /** Renders greyed-out when true. Falls back to `false`. */
  isDisabled?: (ctx: MenuContext) => boolean;

  /**
   * Presence in each surface. Default: all three (`["app", "context", "native"]`).
   * A command like "Toggle Developer Tools" lives only in `native`.
   */
  surfaces?: readonly MenuSurface[];
}

export type MenuSurface = "app" | "context" | "native";

export type MenuCategory =
  | "application" // About, Preferences, Quit
  | "file" // New, Open, Save, Export
  | "edit" // Undo, Cut, Copy, Paste
  | "view" // Sidebar toggle, Zoom, Full screen
  | "workspace" // Switcher, Team invite, Settings
  | "navigate" // Jump to X (mirrors AppResource nav shortcuts)
  | "action" // Create X, Edit X, Delete X
  | "help" // Docs, Keyboard shortcuts, Restart tour
  | "developer"; // Debug, tools; only in dev + admin surfaces
```

`MenuContext` is the read-only snapshot of the app state a command needs to run
— `{ router, identity, tenant, scope, selection, target }` — populated by
whichever renderer opened the menu.

---

## 3. Registry

```ts
// src/config/menu.config.ts
export const menuCommands: readonly MenuCommand[] = [
  // Application group (native menu bar only on Tauri)
  {
    id: "app.about",
    labelKey: "menu.about",
    category: "application",
    surfaces: ["native"],
    execute: openAbout,
  },
  {
    id: "app.preferences",
    labelKey: "menu.preferences",
    shortcut: "Cmd+,",
    category: "application",
    execute: openSettings,
  },
  {
    id: "app.quit",
    labelKey: "menu.quit",
    shortcut: "Cmd+Q",
    category: "application",
    surfaces: ["native"],
    execute: quit,
  },

  // File group
  {
    id: "workspace.new",
    labelKey: "menu.new_workspace",
    shortcut: "Cmd+Shift+W",
    category: "file",
    execute: openWorkspacePicker,
  },
  {
    id: "athlete.create",
    labelKey: "menu.new_athlete",
    shortcut: "N A",
    category: "action",
    requires: "athlete.create",
    execute: navigateToAthleteCreate,
  },
  {
    id: "session.create",
    labelKey: "menu.new_session",
    shortcut: "N S",
    category: "action",
    requires: "session.create",
    execute: navigateToSessionCreate,
  },
  // …one entry per resource module (49 total)

  // Edit group — web only (browser handles OS-standard cut/copy/paste)
  {
    id: "edit.undo",
    labelKey: "menu.undo",
    shortcut: "Cmd+Z",
    category: "edit",
    surfaces: ["native"],
    execute: undo,
  },
  {
    id: "edit.redo",
    labelKey: "menu.redo",
    shortcut: "Cmd+Shift+Z",
    category: "edit",
    surfaces: ["native"],
    execute: redo,
  },

  // View group
  {
    id: "view.command_palette",
    labelKey: "menu.command_palette",
    shortcut: "Cmd+K",
    category: "view",
    execute: openCommandPalette,
  },
  {
    id: "view.toggle_sidebar",
    labelKey: "menu.toggle_sidebar",
    shortcut: "Cmd+\\",
    category: "view",
    execute: toggleSidebar,
  },
  {
    id: "view.toggle_theme",
    labelKey: "menu.toggle_theme",
    shortcut: "Cmd+Shift+T",
    category: "view",
    execute: toggleTheme,
  },

  // Navigate group — pulled from AppResourceShortcuts (Section 4.4 below)

  // Help group
  {
    id: "help.docs",
    labelKey: "menu.docs",
    category: "help",
    execute: openDocs,
  },
  {
    id: "help.keyboard_shortcuts",
    labelKey: "menu.keyboard_shortcuts",
    shortcut: "?",
    category: "help",
    execute: openShortcutsSheet,
  },
  {
    id: "help.restart_tour",
    labelKey: "menu.restart_tour",
    category: "help",
    execute: restartTour,
  },
  {
    id: "help.report_issue",
    labelKey: "menu.report_issue",
    category: "help",
    execute: openIssueForm,
  },

  // Developer group — only visible in dev mode + platform-admin builds
  {
    id: "dev.toggle_devtools",
    labelKey: "menu.devtools",
    shortcut: "Cmd+Alt+I",
    category: "developer",
    surfaces: ["native"],
    isVisible: () => import.meta.env.DEV,
    execute: toggleDevTools,
  },
] as const;
```

The list above is illustrative; the actual `menu.config.ts` scaffold ships in
Task 8 of this session with docblocks + `TODO` stubs so no dead code lands.

---

## 4. Native application menu (macOS-style menu bar)

### 4.1 Where it renders

- **macOS**: real menu bar at the top of the screen (menu bar always visible;
  the app owns the top-menu-bar strip when focused).
- **Windows**: menu bar drawn at the top of the app window frame (native Tauri
  window decoration renders it inside the title strip).
- **Linux**: same as Windows.
- **Web + PWA**: not rendered. The Application menu category disappears
  entirely; commands that live only in `native` surface are unreachable via menu
  but still callable via keyboard shortcuts + command palette.

### 4.2 Structure (macOS)

Following macOS Human Interface Guidelines:

```
Academorix                         (application menu — special first slot)
├── About Academorix
├── ────────
├── Preferences…              ⌘,
├── ────────
├── Services            ▸
├── ────────
├── Hide Academorix            ⌘H
├── Hide Others             ⌥⌘H
├── Show All
├── ────────
└── Quit Academorix           ⌘Q

File
├── New Workspace           ⇧⌘W
├── ────────
├── New Athlete                N A
├── New Session                N S
├── New Team                   N T
├── New Match                  N M
├── New Event                  N E
├── ────────
├── Import…                 ⌘I
└── Export…             ⇧⌘E

Edit
├── Undo                     ⌘Z
├── Redo                    ⇧⌘Z
├── ────────
├── Cut                      ⌘X
├── Copy                     ⌘C
├── Paste                    ⌘V
├── ────────
└── Select All               ⌘A

View
├── Toggle Sidebar          ⌘\
├── Command Palette          ⌘K
├── ────────
├── Toggle Theme          ⇧⌘T
└── Enter Full Screen     ⇧⌘F

Navigate                (dynamically populated from AppResourceShortcuts)
├── Go to Dashboard          G D
├── Go to Athletes           G A
├── Go to Teams              G T
├── Go to Sessions           G S
├── …

Window
├── Minimize                 ⌘M
├── Zoom
├── ────────
├── Bring All to Front
└── Academorix — {workspace}     (current window)

Help
├── Academorix Help
├── Keyboard Shortcuts        ?
├── Restart Tour
├── Report an Issue
└── About Academorix
```

Windows/Linux use the same tree with `Preferences…` moving under
`File → Preferences…` per platform convention. Tauri's `Menu` API generates the
right platform tree automatically when we express the menu in our neutral
registry.

### 4.3 Wiring

- `src/desktop/native-menu.ts` reads `menuCommands` from
  `src/config/menu.config.ts`.
- Filters by `surfaces.includes("native")`, `requires`, `isVisible`.
- Groups by `category` in fixed order:
  `application → file → edit → view → navigate → workspace → window → help → developer`.
- Serialises to Tauri's menu descriptor (see `@tauri-apps/api/menu`).
- The Rust side wires each item's click handler to fire an `ipc://menu-command`
  event with the `id`; JS receives it, looks up the command, and runs
  `execute(ctx)`.

### 4.4 Navigate group is dynamic

The `Navigate` submenu is generated at boot from
`AppResourceMeta.shortcuts.navigate` on every registered resource. When we add a
new module (Phase 2b work), its "Go to X" appears in the menu automatically.
Same source of truth as the command palette.

### 4.5 Enabled state

- `isDisabled(ctx)` runs at menu-open time (macOS's `menuNeedsUpdate:`
  equivalent, cheap because we open only on user interaction).
- Prevents flicker of enabled → disabled after click.

---

## 5. In-app top bar (web + PWA + desktop)

This is the existing navbar rendered inside `authenticated-layout.tsx`. It stays
roughly identical across surfaces but gains a few affordances when Tauri.

Layout (LTR — mirrored automatically in RTL):

```
┌────────────────────────────────────────────────────────────────────────┐
│  [ Academorix logo ]  [ Workspace switcher ▼ ]     …     [ ⌘K ]  [ 🔔 ]  [ ? ]  [ 👤 avatar ▼ ]  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Logo** — clickable → `/dashboard`.
- **Workspace switcher** — HeroUI Dropdown listing workspaces
  (`useWorkspaces()`). Includes a "Create workspace" footer link.
- **Global search trigger** — chip with `⌘K` hint. Opens the command palette.
- **Notification bell** — HeroUI Badge with unread count; opens the notification
  center drawer (see `NOTIFICATIONS_PLAN.md`).
- **Help menu** — HeroUI Dropdown containing exactly the `help` category from
  `menuCommands`. Ships shortcuts inline.
- **Profile avatar** — HeroUI Dropdown with sections:
  - Header: name + email + tenant.
  - Actions: Settings, Preferences, Sign out.
  - Toggles: Theme (Auto / Light / Dark), DND, Compact mode.
  - Footer: `About Academorix`, `Report an issue`.

### 5.1 Desktop-specific navbar additions

- **Traffic-light padding** on macOS: 68 px left-inset so the logo sits clear of
  the window controls.
- **Drag region**: `data-tauri-drag-region` on the empty navbar space so users
  can drag the window from the bar.
- **Window controls** on Windows/Linux (custom-drawn) when `decorations: false`
  — matches the app's typography.
- The Help menu adds a "Check for updates" entry (native path only).

---

## 6. Right-click context menu

### 6.1 Where it fires

- Data grid rows (edit, duplicate, delete, view details, copy id).
- Table cells (copy value, open filter, hide column).
- Sidebar items (pin, hide, jump to settings for that resource).
- Chart data points (open the underlying record).
- Empty area of the workspace canvas (paste, new record, refresh, keyboard
  shortcuts).

### 6.2 Rendering

- Custom hook `useContextMenu(anchor, items)` — attaches a `contextmenu`
  handler, positions a HeroUI Popover at the pointer coordinates, dispatches
  item clicks.
- Suppresses the default browser context menu ONLY when we have items to show
  for the target. Rest of the app keeps browser context menu (right-click →
  Inspect Element still works for devs).
- Native right-click on Tauri desktop routes through the same web component — we
  do NOT use `tauri::menu::ContextMenu` because our menu is data-driven and
  dynamic-per-target; a native context menu would need round-trip IPC per open.

### 6.3 Item selection

- Filtered from `menuCommands` by `surfaces.includes("context")` +
  target-specific predicates.
- Grouped by `category`; separators between groups.
- Max 12 items; overflow into a `More…` submenu.
- Keyboard nav: Arrow keys, Enter to activate, Escape to close, Tab traps focus.

### 6.4 Bulk selection

When multiple rows are selected and the user right-clicks any of them, the
context menu switches to **bulk mode** — showing verbs that accept an array
(`Delete selected`, `Assign coach…`, `Move to team…`, `Export`). Non-bulk items
are hidden.

---

## 7. Keyboard shortcuts

- **Single source**: `menuCommands` is the ONLY place shortcuts are declared for
  menu items. `AppResourceShortcuts` remains the source for resource
  navigate/create shortcuts and is imported by the registry (see §4.4).
- **Display**: shortcut renderer converts `Cmd+K` → `⌘K` on macOS, `Ctrl+K`
  elsewhere. Chords like `G A` render with a subtle separator. Registered
  helper: `formatShortcut(shortcut: string, os: OSKind)`.
- **Conflict detection**: boot-time check (dev only) — logs `console.warn` if
  two commands share a shortcut on the same surface.
- **Discoverability**: `?` opens the `Keyboard shortcuts sheet` — a HeroUI Modal
  listing every command grouped by category, filterable by search. Read-only for
  now; user-customisable in Phase 4.

---

## 8. Permissions

Every command with a `requires` field goes through the access control provider
(`src/providers/access-control`) BEFORE rendering. Denied commands are hidden —
not just disabled — so users don't hover over "New athlete" that they can never
invoke.

```ts
async function canShow(
  command: MenuCommand,
  ctx: MenuContext,
): Promise<boolean> {
  if (command.requires) {
    const codes = Array.isArray(command.requires)
      ? command.requires
      : [command.requires];
    for (const code of codes) {
      const result = await accessControlProvider.can({
        resource: code,
        action: "any",
      });
      if (!result.can) return false;
    }
  }
  if (command.isVisible && !command.isVisible(ctx)) return false;
  return true;
}
```

The predicate is memoised per session (permissions rarely flip mid-session; a
full re-check runs on `identity change` events).

---

## 9. i18n + RTL

- Every `labelKey` and `descriptionKey` is a dot-key into
  `messages/{locale}.json` (see `apps/dashboard/src/lib/i18n/`).
- Native menu bar labels: `translate(labelKey, locale)` runs at menu build time;
  menus are torn down + rebuilt on locale change (cheap — <5 ms).
- In-app menus consume labels via `useTranslate()` — automatically re-render on
  locale change.
- RTL: HeroUI Popover automatically flips anchor side + arrow when
  `<html dir="rtl">`. Native Tauri menus flip on macOS when the system locale is
  `ar`; Windows/Linux we set `dir="rtl"` explicitly on our menu descriptor.

Shortcut glyphs are locale-invariant (`⌘`, `⇧`, `⌃`, `⌥`) so no translation
needed there.

---

## 10. Files

```
src/menus/
  index.ts                     barrel
  command.types.ts             MenuCommand, MenuContext, enums
  use-context-menu.ts          hook — attaches contextmenu handler
  context-menu.tsx             HeroUI Popover-based renderer
  keyboard-shortcut-sheet.tsx  the `?` reference sheet
  format-shortcut.ts           `Cmd+K` → `⌘K` per OS
  registry-helpers.ts          filter/group/sort helpers
  bindings/
    native-menu.ts             Tauri IPC bridge — builds + updates native menu
    web-menu.ts                (thin) — currently in-app menus use HeroUI directly
```

Config lives at `src/config/menu.config.ts` — the `menuCommands` registry.

---

## 11. Rollout — 3 phases

### Phase 1 — Web menus (2 weeks)

- Ship `menu.config.ts` registry with all `application`, `help`, `view`, plus
  every resource `navigate`/`create` command already declared on
  `AppResourceShortcuts`.
- Wire the in-app top bar (workspace switcher, notification bell, help, profile)
  via HeroUI Dropdowns fed by the registry.
- Ship the context menu hook + renderer.
- Wire context menus on the DataGrid rows (already scaffolded — extend), sidebar
  items, empty-state canvas.
- Ship `?` shortcut sheet.
- Green light: right-click on any data grid row shows a working,
  permission-gated menu; `?` opens the sheet.

### Phase 2 — Native menu bar (1 week; requires Tauri Phase 2)

- Ship `native-menu.ts` bridge.
- Build the macOS/Windows/Linux menu tree from the registry.
- Wire IPC round-trip for menu clicks.
- Locale rebuild trigger.
- Green light: `Cmd+,` opens Preferences from the OS menu bar;
  `File → New Athlete` navigates.

### Phase 3 — Customisation + polish (deferred to post-GA)

- User-editable shortcuts via `Settings → Keyboard`.
- Reorderable navbar (like Chrome's toolbar customization).
- Menu analytics dashboard showing usage of each command (drives future
  removals).

Total ~3 weeks Phase 1 + 2, Phase 3 is deferred.

---

## 12. Open questions

1. Do we ship a **Recents** submenu (Recent workspaces, Recent athletes) inside
   the native File menu? Adds value on desktop but needs a recents tracker
   service.
2. Should the **command palette** also expose menu commands (currently just
   navigate + create resource commands)? Argument for yes: single source of
   truth for discoverability. Argument against: overloaded palette.
3. Do we honour macOS's `Preferences…` renaming to `Settings…` on macOS 13+?
   System Preferences was renamed system-wide but Tauri hasn't caught up on this
   default.
4. Windows menu bar under the title strip vs. above the title bar? Modern
   Windows apps often drop the menu bar; we keep it for parity with macOS.
5. Do power users want a "Do more…" fuzzy submenu that folds low-usage commands
   out of sight? Better to just prune the low-usage ones IMO.
6. Custom shortcut editor: block system-reserved combos (`Cmd+Space`, `Cmd+Tab`,
   `Cmd+Q`)? Blocking is easy but users complain when they can't rebind Q.
   Compromise: warn + require re-confirmation.
7. RTL: should we mirror keyboard shortcut display too (`K⌘` instead of `⌘K`)?
   Localisation authorities recommend NOT mirroring shortcut glyphs (they're
   symbolic, not text). Current plan: leave LTR.
8. Do we surface a "developer" category on production builds for staff
   impersonating a tenant? Probably yes — audit logs need to know staff invoked
   a dev command.

---

## 13. Related documents

- [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — Tauri menu API + tray + global
  shortcuts.
- [`NOTIFICATIONS_PLAN.md`](./NOTIFICATIONS_PLAN.md) — DND toggle + notification
  bell wiring.
- [`ONBOARDING_PLAN.md`](./ONBOARDING_PLAN.md) — Help → Restart tour entry.
- [`DASHBOARD_UX_PLAN.md`](./DASHBOARD_UX_PLAN.md) — parent UX spec.
