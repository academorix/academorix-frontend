# Academorix Dashboard — Desktop App Plan

> Status: **draft** · Last review: 2026-07 · Owner: platform team.
>
> This document is the source of truth for how we ship the
> `@academorix/dashboard` SPA as a native desktop application on macOS, Windows,
> and Linux. It captures the framework decision, the phased rollout, every OS
> integration point, and the open questions we still need to answer.

---

## 1. Decision — Tauri v2 (not Electron)

We ship the desktop app on **Tauri v2**.

### 1.1 Why Tauri over Electron

| Criterion                     | Tauri v2                                                            | Electron                                                  | Winner                              |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------- |
| Installer size                | 5-15 MB                                                             | 80-150 MB per app                                         | **Tauri**                           |
| Runtime memory                | 40-90 MB idle                                                       | 200-400 MB idle                                           | **Tauri**                           |
| Cold start                    | 0.4-0.8 s                                                           | 1.5-3.0 s                                                 | **Tauri**                           |
| Security model                | Default deny + capability-based permissions                         | Node integration on by default                            | **Tauri**                           |
| Auto-updater                  | Built-in (`tauri-plugin-updater`) with signature verification       | Squirrel/electron-updater; hosting cost                   | **Tauri**                           |
| Deep links / protocol handler | `tauri-plugin-deep-link`                                            | `app.setAsDefaultProtocolClient` + manual OS registration | Tie                                 |
| Native menus + tray           | `tauri::menu` + `tauri::tray` (typed Rust API)                      | `Menu`, `Tray` (JS)                                       | Tie (both first-class)              |
| System notifications          | `tauri-plugin-notification` (uses OS-native)                        | `Notification` main-process API                           | Tie                                 |
| Renderer engine               | OS webview (WKWebView / WebView2 / WebKitGTK) — no bundled Chromium | Bundled Chromium                                          | Tauri for size, Electron for parity |
| Ecosystem maturity            | Post-v2 GA (2024-10); growing but smaller                           | 12 years of production apps                               | **Electron**                        |
| Native features from JS       | JS ↔ Rust IPC (`invoke`)                                            | Direct Node.js                                            | Electron for convenience            |
| React SPA reuse               | Loads any HTTP-served or bundled webapp verbatim                    | Same                                                      | Tie                                 |
| Mobile targets                | iOS + Android (Tauri v2)                                            | None                                                      | **Tauri** (future-proofing)         |

**Deciding factor:** the dashboard is a business tool used all day. A 100 MB
per-user install with a resident Chromium copy is a hard sell against a 12 MB
Tauri build that starts in half a second. Renderer parity concerns are real but
manageable — HeroUI Pro + Tailwind v4 target the same browser matrix that
WKWebView / WebView2 supports.

### 1.2 What we accept

- **WKWebView on macOS** ≥ 12 (matches Safari 15+ feature parity).
- **WebView2 on Windows** ≥ 10 (auto-installs the Evergreen runtime; Windows 11
  ships it by default).
- **WebKitGTK on Linux** ≥ 2.40 (Ubuntu 22.04+, Fedora 38+). Older distros get
  the browser experience.
- Rust toolchain in the build pipeline. Adds ~30 s to a cold CI job.
- Cross-platform testing needs three runners (macOS-13, windows-2022,
  ubuntu-22.04). Already in Playwright plan.

### 1.3 What we don't lose vs. Electron

- The React SPA code is **byte-for-byte identical**. Tauri loads
  `dist/index.html` (or a live URL in dev) in the OS webview. Zero fork of the
  frontend.
- HMR still works in dev — `tauri dev` proxies to the running Vite dev server on
  `http://localhost:3000`.
- Service worker + IndexedDB + WebSockets (Reverb / Pusher protocol) all work in
  each webview.

### 1.4 When we revisit

- Reevaluate at the end of Phase 3 (see §3 below) once we have real usage data
  and any WKWebView / WebView2 rendering complaints that block adoption.
- Reevaluate immediately if the Rust dep audit (see §7.3) flips red.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  apps/dashboard              (React 19 SPA — unchanged)                 │
│  src/                                                                   │
│  ├─ pwa/            web push, install prompts, offline shell            │
│  ├─ desktop/        NEW — Tauri IPC bindings + native-menu adapters     │
│  ├─ config/                                                             │
│  │  └─ desktop.config.ts   window sizing, tray items, updater endpoint  │
│  └─ …                                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  apps/dashboard/src-tauri    NEW — Rust project (Tauri shell)           │
│  src-tauri/                                                             │
│  ├─ src/                                                                │
│  │  ├─ main.rs      window creation, tray, menu, updater, deep-link     │
│  │  ├─ commands.rs  #[tauri::command] handlers callable from JS         │
│  │  └─ security.rs  ACL enforcement                                     │
│  ├─ Cargo.toml                                                          │
│  ├─ tauri.conf.json  ← generated from apps/dashboard/src/config         │
│  └─ icons/         source PNG icons (rasterized from favicon.svg)       │
├─────────────────────────────────────────────────────────────────────────┤
│  Distribution                                                           │
│  · macOS   →  .dmg + .app        (signed with Developer ID)             │
│  · Windows →  .msi + .exe        (signed with EV cert)                  │
│  · Linux   →  .AppImage + .deb   (unsigned; distro repos later)         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Renderer <-> Native contract

- **Web build** (Vite): unchanged. When running inside Tauri, `window.__TAURI__`
  is truthy so code branches to native paths.
- **Feature detection** (never UA-sniff):

  ```ts
  // src/desktop/is-desktop.ts
  export const isDesktop =
    typeof window !== "undefined" && "__TAURI__" in window;
  ```

- Every native call goes through a thin `@/desktop/*` adapter that resolves to a
  no-op / graceful fallback in the browser build. Example:

  ```ts
  // src/desktop/notifications.ts
  import { isDesktop } from "@/desktop/is-desktop";

  export async function showNativeNotification(
    title: string,
    body: string,
  ): Promise<void> {
    if (!isDesktop) {
      // Web build falls back to the browser Notification API.
      new Notification(title, { body });
      return;
    }
    const { sendNotification } =
      await import("@tauri-apps/plugin-notification");
    await sendNotification({ title, body });
  }
  ```

- The `src-tauri/tauri.conf.json` file is **generated** from
  `src/config/desktop.config.ts` at build time via a small Rust build script —
  never hand-edited. Single source of truth is the TypeScript config.

### 2.2 IPC design

- Two channels: **commands** (JS → Rust request/response) and **events** (Rust →
  JS pub/sub).
- Every command is capability-gated in `tauri.conf.json` via ACLs. We ship with
  the **default-deny** posture (Tauri v2 default) and add allowlists per plugin.
- No `dangerouslyDisableAssetCspModification`, no `withGlobalTauri: true` in
  production builds.

### 2.3 URL model

- Loads a single URL at boot:
  - **Dev:** `http://localhost:3000` (Vite dev server).
  - **Prod:** bundled `dist/` served over the `tauri://localhost` protocol.
- BrowserRouter continues to work — Tauri's webview honours HTML5 history.
- Auth cookies are held in the webview's isolated storage per app (no accidental
  cross-app leakage).

---

## 3. Rollout — 5 phases

### Phase 1 — Boot the shell (1 week)

- Add `src-tauri/` skeleton via `pnpm dlx create-tauri-app` targeting the
  existing `dist/`.
- Wire `tauri dev` to the Vite dev server on `:3000`.
- Ship a minimal window (1440×900, min 1024×720, resizable) with the app title
  and dev-tools enabled.
- Green light: window opens, SPA loads, HMR works, login flow succeeds in mock
  mode.

### Phase 2 — Chrome + branding (1 week)

- Icon set: raster the master `public/favicon.svg` into Tauri's per-platform
  icon requirements (macOS `.icns`, Windows `.ico`, Linux 32/64/128/256/512
  PNG). Wire `pnpm generate-desktop-icons` alongside `generate-pwa-assets`.
- Native application menu (macOS/Windows) — see
  [`MENUS_PLAN.md`](./MENUS_PLAN.md).
- System tray icon with quick-actions (open dashboard, sign out, check for
  updates, quit). Registry lives in `src/config/desktop.config.ts` under
  `tray.items`.
- Splash screen: reuse the SPA loading screen (no separate native splash — keeps
  identity consistent).
- Green light: app quacks like a native app — menu bar, dock icon, tray, name in
  taskbar.

### Phase 3 — OS integrations (2 weeks)

- **Deep links:** register the `academorix://` scheme. Route
  `academorix://workspace/{slug}` and `academorix://reset-password?token=…`
  through `src/lib/desktop/deep-link-router.ts` to the existing React Router.
- **File system:** capability-gated `fs.readTextFile` / `fs.writeTextFile`
  scoped to the OS-standard app-data directory only (no arbitrary user files).
- **Native notifications:** hook `showNativeNotification()` into the
  notification queue (see [`NOTIFICATIONS_PLAN.md`](./NOTIFICATIONS_PLAN.md)).
- **Clipboard:** capability-gated. Read on user gesture only.
- **Global shortcuts:** `Cmd/Ctrl+Shift+A` to raise the app (registered on
  install; user can disable in Settings → Desktop).
- **OS theme sync:** subscribe to Tauri's `theme-changed` event and mirror into
  HeroUI's dark-mode toggle when the user hasn't manually set a preference.
- Green light: deep links launch the app, notifications render natively, global
  shortcut works on all three OSes.

### Phase 4 — Auto-update + telemetry (1 week)

- `tauri-plugin-updater` pointing at
  `https://updates.academorix.com/dashboard/{target}/{arch}/{current-version}` —
  a JSON manifest served from Vercel (or S3+CloudFront).
- Signed builds with `TAURI_SIGNING_PRIVATE_KEY` stored in Doppler.
- Update UX: silent background check every 4 h; when a new build is available,
  surface the existing PWA update toast (repurposed) with **Install and
  restart** action. Same UX affordance as the web build.
- Telemetry: mirror the analytics event registry
  (`src/config/analytics.config.ts`) to Rust. Ship native events
  (`desktop_launched`, `desktop_updated`, `desktop_crashed`) through the same
  backend endpoint.
- Green light: dev pushes a v0.2.0 → users on v0.1.0 see the toast within 4 h
  and can install without a reinstall.

### Phase 5 — Distribution + signing (1 week)

- **macOS:** Apple Developer ID cert; hardened runtime; notarization via
  `xcrun altool`. Distribution channel: signed `.dmg` from
  `updates.academorix.com`.
- **Windows:** EV code-signing cert (avoids SmartScreen warnings for new
  installs). MSI installer with per-user install by default. Distribute via
  `.exe` bootstrapper + signed `.msi`.
- **Linux:** `.AppImage` (portable) + `.deb` (Ubuntu/Debian). No signing;
  publish SHA-256 checksums.
- CI: three parallel jobs on GitHub Actions matrix (macos-14, windows-2022,
  ubuntu-22.04) triggered on version-tag push. Artifacts uploaded to a GitHub
  release + mirrored to the update server.
- Green light: fresh macOS/Windows/Linux VMs can install and open the app
  without warnings.

**Total effort: ~6 engineering weeks.** Phase 1 unblocks internal dogfooding;
phase 5 is what customers download.

---

## 4. Integration points

### 4.1 Window management

- Single main window per user. Multiple workspaces = multiple browser windows
  within the same app (Tauri `WebviewWindow::new`).
- Persist window position/size in the OS-standard state directory. Restore on
  next launch.
- Handle: dock/taskbar unread badge (Tauri `set_badge_count`) driven by unread
  notification count.
- Handle: minimize-to-tray on close (opt-in setting; default: quit on close,
  macOS default: hide).

### 4.2 Menu bar (see [`MENUS_PLAN.md`](./MENUS_PLAN.md))

- macOS-style app menu (Application, File, Edit, View, Window, Help) rendered
  natively via `tauri::menu`.
- Same command palette as the web build; menu items map 1:1 onto
  `AppResourceShortcuts` entries so shortcuts stay authoritative.
- In web builds the menu bar is invisible — command palette is the substitute.

### 4.3 Tray / menu-bar icon

- **macOS:** menu-bar tray icon (top-right). Left-click opens a mini popover
  with unread badge + quick actions; right-click opens the same context menu.
- **Windows:** system-tray icon. Same behaviour but positioned in the
  lower-right.
- **Linux:** best-effort (some DEs disable tray). Falls back to a launcher
  shortcut.

### 4.4 Notifications

- Native notifications for background alerts (see
  [`NOTIFICATIONS_PLAN.md`](./NOTIFICATIONS_PLAN.md)).
- OS-integrated (macOS Notification Center, Windows Action Center, Linux
  DBus/notify-send).
- Reverb WebSocket keeps the primary in-app notification badge live; the same
  event dispatches a native notification when the app is unfocused.

### 4.5 Deep links

- Registered scheme: `academorix://` (case-insensitive, no double slash needed
  for OS handlers but included for HTTP-URL parity).
- Route table:
  - `academorix://workspace/{slug}` → `/{slug}/dashboard`
  - `academorix://workspace/{slug}/{resource}` → `/{slug}/{resource}`
  - `academorix://reset-password?token=…&email=…` → `/reset-password?…`
  - `academorix://invite?code=…` → `/invite/{code}`
  - `academorix://join?token=…` → `/onboarding/join?…`
- Handled inside `src/lib/desktop/deep-link-router.ts` — parses the URL,
  dispatches via `useNavigate()`.
- Marketing site (`apps/landing-page`) adds "Open in Academorix" buttons that
  fall back to the web app when the desktop app isn't installed.

### 4.6 Auto-update

- Endpoint contract:
  ```json
  {
    "version": "0.2.0",
    "notes": "…",
    "pub_date": "2026-07-10T09:00:00Z",
    "platforms": {
      "darwin-x86_64": {
        "signature": "…",
        "url": "https://…/Academorix_0.2.0_x64.app.tar.gz"
      },
      "darwin-aarch64": {
        "signature": "…",
        "url": "https://…/Academorix_0.2.0_aarch64.app.tar.gz"
      },
      "windows-x86_64": {
        "signature": "…",
        "url": "https://…/Academorix_0.2.0_x64-setup.nsis.zip"
      },
      "linux-x86_64": {
        "signature": "…",
        "url": "https://…/Academorix_0.2.0_amd64.AppImage.tar.gz"
      }
    }
  }
  ```
- Signature verified against the public key bundled in `tauri.conf.json`.
- Rollback path: users can re-download an older `.dmg`/`.msi`/`.AppImage` from
  the release page.

---

## 5. Config surface

Every desktop knob lives in `apps/dashboard/src/config/desktop.config.ts`. Rust
reads a serialized snapshot at build time (via a `build.rs` script) so both
sides stay in lock-step.

Fields (see the file for the source of truth):

- `app.protocol` — deep-link scheme (`"academorix"`).
- `app.updateFeedUrl` — auto-updater manifest URL.
- `window.default` —
  `{ width, height, minWidth, minHeight, resizable, transparent, decorations }`.
- `window.restoreState` — persist/restore last size + position.
- `tray.enabled` — bool; `tray.items` — `TrayItem[]`.
- `updater.enabled` — bool; `updater.intervalMs` — poll cadence.
- `security.allowFileDrop` — bool (default `false`).
- `security.allowedShellCommands` — allowlist of shell-out commands (default
  empty).
- `logging.level` — `"error" | "warn" | "info" | "debug"`.

---

## 6. Distribution + signing

| Target         | Format                 | Signing                       | Notarization     |
| -------------- | ---------------------- | ----------------------------- | ---------------- |
| macOS Intel    | `.dmg` + `.app.tar.gz` | Developer ID Application      | Apple notary API |
| macOS Silicon  | `.dmg` + `.app.tar.gz` | Developer ID Application      | Apple notary API |
| Windows x86_64 | `.msi` + `.exe` (NSIS) | EV code-signing cert          | —                |
| Linux x86_64   | `.AppImage` + `.deb`   | GPG-signed detached signature | —                |

Certs held in **Doppler** (`academorix-desktop` project), rotated annually.
GitHub Actions injects them for signed builds only; PRs get unsigned artifacts.

---

## 7. Security

### 7.1 CSP

- Same Content-Security-Policy the web build ships plus `tauri://localhost` and
  `ipc:` scheme additions. Managed centrally in `pwa.config.ts` → `security.csp`
  so the desktop and web strings never drift.

### 7.2 Tauri capabilities

- Default-deny. Explicitly enable per feature:
  - `fs.readTextFile` scoped to `$APPDATA/*`
  - `notification.send`
  - `shell.open` restricted to `https://academorix.com/*`,
    `https://academorix.app/*`, `mailto:*`
  - `updater.check`, `updater.install`
  - `dialog.open` (file picker for imports)
- No `shell.execute`. No `path.resolve`. No `http.fetch` (we always go through
  the SPA's own fetch client).

### 7.3 Dependency audit

- `cargo audit` runs on every CI build. Blocks merge on any `RUSTSEC-*` advisory
  ≥ medium.
- `pnpm audit` on the frontend side.
- Quarterly review of every `tauri-plugin-*` we depend on.

### 7.4 Sandbox

- The webview runs in each OS's default browser sandbox (macOS App Sandbox,
  Windows AppContainer, Linux WebKitGTK sandbox).
- No `NODE_INTEGRATION` equivalent because Tauri doesn't ship Node.js at all —
  the whole class of "renderer can `require('child_process')`" bugs is gone by
  design.

---

## 8. Open questions

1. Do we want a **portable** (no-install) Windows build alongside the MSI?
   Common ask for locked-down environments.
2. Auto-updater delivery method: static manifest (simpler) vs. Tauri's built-in
   cloud service (Sentry-like) vs. GitHub Releases API. Leaning **static
   manifest** for control and no runtime dependency.
3. Do coaches on shared computers need a **kiosk mode**? Requires locking down
   the tray, disabling deep-link registration, and hiding the update prompt.
4. Which Windows install policy: per-user (no admin needed) vs. per-machine
   (needs admin, one install serves all Windows users)? Leaning **per-user by
   default, per-machine via MSI switch**.
5. Should the desktop app ship an in-app diagnostic bundle command (logs +
   system info) for support triage?
6. Do we need **portable macOS unsigned builds** for developer previews? Devs
   currently rely on Vercel previews only.
7. Where do we host the auto-update manifest? Preference is
   `updates.academorix.com` (Vercel edge) but could also live on
   `updates.academorix.app` next to the SPA.
8. When does the Linux Snap / Flatpak story become worth it? Deferred until we
   have >1000 Linux MAU.

---

## 9. Related documents

- [`NOTIFICATIONS_PLAN.md`](./NOTIFICATIONS_PLAN.md) — how native notifications
  and web push interoperate.
- [`ONBOARDING_PLAN.md`](./ONBOARDING_PLAN.md) — first-run experience for the
  desktop app.
- [`MENUS_PLAN.md`](./MENUS_PLAN.md) — top-bar and context menu architecture,
  native vs. web parity.
- [`DASHBOARD_UX_PLAN.md`](./DASHBOARD_UX_PLAN.md) — the SPA UX spec that the
  desktop shell wraps.
