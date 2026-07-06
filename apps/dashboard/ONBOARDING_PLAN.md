# Academorix Dashboard — Onboarding Plan

> Status: **draft** · Last review: 2026-07 · Owner: platform team.
>
> How the Academorix dashboard onboards new users across three surfaces: browser
> web app, installed PWA (first launch after home-screen add), and native Tauri
> desktop app (first launch after install). Also covers the empty-state
> onboarding checklist that lives on the dashboard overview.

---

## 1. Goal

Get every new user to their **first meaningful action** — creating an athlete,
scheduling a session, sending an invite — inside 3 minutes of the first launch.
Anything longer and drop-off climbs past 40%.

Four flows compose the plan:

1. **Workspace creation** — pre-app: marketing site → create-workspace form →
   verify email → land in app.
2. **First-run tour** — post-app: guided 4-step tour of the sidebar + command
   palette + inbox + settings.
3. **Onboarding checklist** — persistent dashboard widget with 12 setup tasks.
   Progresses from tour end until 100% complete or dismissed.
4. **Surface-specific first-run** — extra affordances triggered when we detect a
   PWA install or a desktop launch.

---

## 2. Surface detection

Three sources of "how did the user land here":

| Surface         | Signal                                                                                | Where it's read                    |
| --------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| Web (default)   | Nothing special                                                                       | Baseline path                      |
| PWA (installed) | `?source=pwa` in `start_url` (manifest → §5) + `display-mode: standalone` media query | `src/onboarding/detect-surface.ts` |
| PWA shortcut    | `?source=pwa-shortcut` on the URL                                                     | Same                               |
| Desktop (Tauri) | `window.__TAURI__` truthy                                                             | `src/desktop/is-desktop.ts`        |
| Deep link       | `academorix://…` (already resolved to a route by desktop-deep-link-router)            | Router-level side-effect           |

Surface is exposed via one hook:

```ts
// src/onboarding/use-surface.ts
type Surface = 'web' | 'pwa' | 'pwa-shortcut' | 'desktop' | 'deep-link';

export function useSurface(): Surface { … }
```

`useSurface()` reads once on first render and caches for the session. Surface
never changes mid-session.

---

## 3. Flow 1 — Workspace creation (pre-app)

Handled by the marketing site
(`apps/landing-page/app/create-workspace/page.tsx`) — out of scope for this
document, but the contract this doc extends:

- User submits the create-workspace form → backend provisions
  `{ tenant, adminUser }`.
- Verification email arrives with a `?token=…` link opening
  `https://app.academorix.com/verify-email?token=…`.
- On success, redirect to `/dashboard?firstRun=1&source=signup`.
- `firstRun=1` triggers Flow 2 automatically. It's separate from `source=pwa`
  because a signup-driven first-run behaves differently from a home-screen
  install first-run.

The dashboard treats `firstRun=1` as a one-shot: reading + removing the query
param on first render so a refresh doesn't retrigger.

---

## 4. Flow 2 — First-run tour

### 4.1 UX

- HeroUI **Popover** anchored to real UI elements (sidebar item, navbar bell,
  command palette trigger, settings gear). NOT a modal overlay — modals feel
  disruptive.
- **4 steps**, one popover per step. Each has a **Skip** link (top-right) and
  **Back** / **Next** actions.
- Overlay dims the rest of the app to 40% opacity so the popover target pops.
- Total ~30 seconds if the user just clicks Next; can be re-run from
  `Settings → Help → Restart tour`.

### 4.2 Step contents

| #   | Anchor                   | Title                          | Body                                                                                            | Action                                      |
| --- | ------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Sidebar `Athletes` group | **Everything is a workspace**  | "Your data lives here — athletes, teams, sessions, payments. Try clicking one."                 | **Next**                                    |
| 2   | Command palette trigger  | **⌘K jumps you anywhere**      | "Fastest way to move — press `⌘K` (Ctrl+K on Windows), type what you need."                     | **Try it** (opens the palette in demo mode) |
| 3   | Notification bell        | **You'll never miss an alert** | "Late check-ins, failed payments, safeguarding flags — they all surface here."                  | **Next**                                    |
| 4   | Settings gear            | **Everything's tunable**       | "Branding, permissions, integrations, feature flags — all here. Have a look when you're ready." | **Finish**                                  |

### 4.3 Persistence

- One localStorage key: `academorix.onboarding.tour.v1` →
  `{ completedAt, dismissedAt, step, restartedCount }`.
- Version suffix (`v1`) so a future refactor with a new step list can trigger
  the tour again for existing users without stomping on legacy state.
- Scoped by user id so switching accounts on the same browser retriggers
  correctly.

### 4.4 When it fires

- `firstRun=1` in URL → always.
- `source=pwa` and `academorix.onboarding.tour.v1` unset → yes.
- `isDesktop` and `academorix.onboarding.tour.v1` unset → yes (with a
  desktop-specific step 0 preface — see §7).
- Otherwise: no. Users see the checklist widget only.

---

## 5. Flow 3 — Onboarding checklist

Already scaffolded in Phase 1c (see
`src/modules/dashboard/widgets/onboarding-checklist/`). This plan formalises its
contract.

### 5.1 12 tasks

| #   | Task                        | Detection                                            | Path                                       |
| --- | --------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| 1   | Complete your profile       | `me.profileCompletedAt !== null`                     | `/settings/profile`                        |
| 2   | Invite your team            | `users.count > 1`                                    | `/settings/team`                           |
| 3   | Add your first branch       | `branches.count > 0`                                 | `/branches/create`                         |
| 4   | Create your first athlete   | `athletes.count > 0`                                 | `/athletes/create`                         |
| 5   | Set up billing              | `stripe.connected === true` OR manual                | `/settings/billing`                        |
| 6   | Schedule your first session | `sessions.count > 0`                                 | `/sessions/create`                         |
| 7   | Create your first team      | `teams.count > 0`                                    | `/teams/create`                            |
| 8   | Take your first attendance  | `attendance.count > 0`                               | `/attendance`                              |
| 9   | Send your first invoice     | `invoices.count > 0`                                 | `/payments/invoices/create`                |
| 10  | Customize your branding     | `settings.branding.dirty === true` (manual mark)     | `/settings/branding`                       |
| 11  | Install the app             | Detected via `beforeinstallprompt` + `isInstalled()` | Native prompt                              |
| 12  | Read the safeguarding guide | Manual mark                                          | `https://docs.academorix.com/safeguarding` |

Task 5, 10, 12 are **manual-mark** (there's no server-side detection cheaper
than the "Mark done" button); the rest auto-tick from useList row counts.

### 5.2 State

localStorage `academorix.onboarding.checklist.v1`:

```ts
interface ChecklistState {
  dismissed: boolean;
  hidden: string[]; // task ids the user "hid" from the widget
  manuallyCompleted: string[]; // ids ticked by the "Mark done" button
  restoredFromCloud: boolean; // set once the backend catches up
}
```

Migration to backend-backed state is a Phase 4 concern (see
`NOTIFICATIONS_PLAN.md` §11 — same shape of migration).

### 5.3 Display

- Compact card in the top-right of the dashboard overview.
- Header: `Get started — 4/12`. Progress bar.
- Expandable: click to open a Drawer listing every task with checkbox +
  description + "Do it now" button routing to the path.
- Auto-hides when 12/12 complete or manually dismissed.

---

## 6. Flow 4 — PWA-specific first-run

Triggered when `useSurface() === 'pwa'` OR `'pwa-shortcut'` AND the
surface-specific storage key isn't set.

Additions on top of the base tour:

- **Toast on launch**:
  `toast.success('Academorix installed', { description: 'It'll work offline too.', timeout: 8000 })`.
- **Extra tour step 0** anchored to the shell (no specific element, centered):
  "You're using the installed app — it caches offline and gets automatic
  updates."
- **Encourage notifications** at the end of the tour: replace the "Finish"
  button with a `Enable notifications` CTA (feeds into `NOTIFICATIONS_PLAN.md`'s
  contextual request). Skip → checklist mode.
- **Shortcut discovery**: highlight the App Shortcuts (from manifest) at the OS
  level using an animated pointer overlay for macOS/Android home-screen users.

Persisted key: `academorix.onboarding.pwa.v1` →
`{ firstLaunchedAt, tourCompletedAt, notificationPromptShownAt }`.

---

## 7. Flow 4 — Desktop-specific first-run

Triggered when `isDesktop && !hasSeenDesktopWelcome`.

Additions:

- **Native welcome window** before the SPA loads (Tauri side): 480×360, brand
  mark, "Welcome to Academorix". Two buttons: `Sign in` / `Create a workspace`.
  - `Sign in` closes the welcome window and loads `/login`.
  - `Create a workspace` opens the marketing site's create-workspace form in the
    default browser (avoids embedding the signup flow inside the desktop app).
- **First-launch tour step 0** anchored to the tray icon (native tour
  continuation): "We live in the menu bar too. Click here for quick actions."
- **Global shortcut coachmark**: after tour end, a toast: "Press `⌘ Shift A` to
  raise Academorix from anywhere. Change it in Settings → Desktop."
- **Auto-update opt-in**: settings row toggled ON by default with an explanation
  in the tour.

Persisted key (server-backed once auth exists):
`academorix.onboarding.desktop.v1` →
`{ welcomeShownAt, shortcutCoachmarkShownAt, updaterOptedInAt }`.

---

## 8. Files

```
src/onboarding/
  index.ts                            barrel
  onboarding.types.ts                 Surface, TourStep, ChecklistTask enums + interfaces
  use-surface.ts                      hook: web | pwa | pwa-shortcut | desktop | deep-link
  detect-surface.ts                   pure detection logic (unit-testable)
  storage.ts                          typed localStorage adapter with schema validation
  tour/
    tour-provider.tsx                 owns state, exposes useTour()
    tour-popover.tsx                  the HeroUI Popover shell
    steps/
      step-workspace.tsx              step 1
      step-command-palette.tsx        step 2
      step-notifications.tsx          step 3
      step-settings.tsx               step 4
      step-desktop-preface.tsx        desktop-specific step 0
      step-pwa-preface.tsx            pwa-specific step 0
  checklist/                          (already scaffolded)
  desktop/
    welcome-window.ts                 spec for the pre-app native welcome window
```

---

## 9. Configuration

Every knob in `src/config/onboarding.config.ts`:

- `tour.enabled` — global kill-switch.
- `tour.steps` — the 4-step registry (title + body + i18n keys + anchor
  selector + optional action).
- `checklist.tasks` — the 12-task registry (id + detector + path + manualMark
  flag).
- `checklist.dismissible` — bool (defaults `true`).
- `pwa.showWelcomeToast` — bool.
- `desktop.showWelcomeWindow` — bool.
- `desktop.globalShortcut` — default `CmdOrCtrl+Shift+A`.
- `storageVersion` — the `v1` suffix; bumping triggers replay.

---

## 10. Localization

Every user-facing string is a key into the message catalog (`messages/en.json`,
`messages/ar.json`). Anchor selectors are stable (data-testid attributes) so
they don't drift when translations change.

RTL is a first-class concern: HeroUI Popover flips its arrow direction
automatically when `<html dir="rtl">`. We verify with a Playwright test at `ar`
locale.

---

## 11. Analytics

Every step fires one event (see `src/config/analytics.config.ts`):

- `onboarding_tour_started` `{ surface, step_count }`
- `onboarding_tour_step_advanced` `{ from_step, to_step }`
- `onboarding_tour_step_backed` `{ from_step, to_step }`
- `onboarding_tour_skipped` `{ at_step }`
- `onboarding_tour_completed` `{ duration_ms }`
- `onboarding_tour_restarted` `{ trigger }`
- `onboarding_checklist_task_completed` `{ task_id, method: 'auto' | 'manual' }`
- `onboarding_checklist_hidden` `{ task_id }`
- `onboarding_checklist_dismissed`
- `onboarding_pwa_welcome_shown`
- `onboarding_desktop_welcome_shown`

We slice by `surface` religiously — the drop-off curve for web vs. installed PWA
vs. desktop diverges and drives every future onboarding change.

---

## 12. Rollout — 3 phases

### Phase 1 — Web tour + checklist (already shipped in Phase 1c)

- Tour (4 steps).
- Checklist widget (12 tasks).
- localStorage-backed state.
- Green light: `firstRun=1` triggers the tour, dismissing persists, 5
  auto-detected tasks flip when data lands.

### Phase 2 — Surface detection + PWA hooks (1 week)

- Ship `useSurface()`.
- PWA first-launch toast + step 0 preface + notification enablement CTA.
- Cloud-backed state (backend endpoint `PATCH /api/v1/users/me/onboarding`).
- Green light: `?source=pwa` first launch shows the PWA-specific tour path;
  state persists across devices.

### Phase 3 — Desktop hooks (1 week; requires Tauri Phase 2)

- Native welcome window on first Tauri launch.
- Tray coachmark + global shortcut coachmark.
- Auto-update opt-in prompt.
- Green light: fresh Tauri install shows welcome → tour → checklist without
  duplication.

Total ~2 weeks on top of what's already shipped.

---

## 13. Open questions

1. Should we A/B test tour vs. no-tour? Historically tours have a 1-3% lift on
   activation; not free but not huge either.
2. Do we treat the **create-workspace flow itself** as onboarding (adds "Choose
   your sport", "Set your currency", "Pick your first branch" as pre-app steps)
   or keep it minimal (email + password only, everything else post-signup)?
   Currently leaning minimal.
3. Do we let admins **customize the checklist per-workspace**? Different sports
   academies have different first-actions. Nice-to-have; not urgent.
4. The desktop welcome window uses Tauri's native window — is it worth building
   a second, tiny React SPA (`apps/dashboard/welcome/`) for that, or hard-code
   HTML in Rust? Leaning hard-coded HTML for simplicity.
5. Should tour re-fire on major-version bumps (Phase 2 UI overhaul) even for
   existing users? Migration story via bumping `storageVersion` handles it — but
   do we ALSO trigger a "What's new" changelog popup? Deferred.
6. Do we surface a **live coach** hand-off during onboarding (Intercom /
   Chatwoot chat bubble)? Reduces drop-off from 40% → 20% on comparable
   products. Ops cost of staffing it is real.
7. `Task 11 — Install the app` — should we detect if the user has already
   installed on ANY device (via cloud state) and auto-tick it? Currently
   per-device.

---

## 14. Related documents

- [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — Tauri welcome window + tray + global
  shortcut references.
- [`NOTIFICATIONS_PLAN.md`](./NOTIFICATIONS_PLAN.md) — contextual permission
  request at tour end.
- [`MENUS_PLAN.md`](./MENUS_PLAN.md) — Help → Restart tour menu entry.
- [`DASHBOARD_UX_PLAN.md`](./DASHBOARD_UX_PLAN.md) — parent UX spec.
