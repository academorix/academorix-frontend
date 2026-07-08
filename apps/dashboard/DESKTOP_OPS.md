# Academorix Desktop — Ops Runbook

> Status: **v1** · Owner: platform team.
>
> How ops obtains certs, hosts the auto-update manifest, wires GitHub Actions
> for signed releases, notarizes on macOS, and rolls out or rolls back. Every
> credential referenced below is stored in **Doppler** — this doc names the
> keys, never the values.
>
> Companion to [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — read it first for the
> architecture. This file covers Phase 4 (auto-update) and Phase 5 (signing +
> distribution) operational steps end-to-end.

---

## 0. Prerequisites (do this once)

- macOS runner (Apple Silicon or Intel) with **Xcode 15.3+** for `notarytool`.
  Runners without Xcode CLT can't submit for notarization.
- Windows runner with **`.NET 8` SDK** — `AzureSignTool` is a dotnet tool.
- Ubuntu 22.04 runner (Linux builds are unsigned; SHA-256 checksums published
  alongside the artefact).
- Rust toolchain 1.77+ (`rustup default stable`).
- Node 24.x + pnpm 10.x (matches `frontend/.nvmrc`).
- Doppler CLI on every runner. Auth via the OIDC identity token minted by GitHub
  Actions (see `.github/workflows/desktop-release.yml`).

Local one-time setup for a maintainer:

```bash
# macOS: install the Xcode CLT + accept the licence.
xcode-select --install
sudo xcodebuild -license accept

# All platforms: install the Tauri CLI globally for ad-hoc use (the
# CI job uses the workspace-pinned `@tauri-apps/cli` — this is only
# for `tauri signer generate` on the maintainer's laptop).
pnpm add -g @tauri-apps/cli@catalog:

# Confirm the Rust side compiles.
cd apps/dashboard/src-tauri && cargo check
```

---

## 1. Cert provisioning

### 1.1 macOS — Apple Developer ID

Once, per organisation renewal cycle (usually annual).

1. In [Apple Developer](https://developer.apple.com/account) → Certificates,
   create a **Developer ID Application** cert. Distribution outside the Mac App
   Store requires this specific type — not "Mac Distribution" and not "Mac
   Development".
2. Download the `.cer`, install it into the org's macOS keychain, then export as
   **`.p12`** with a strong password.
3. Upload the base64-encoded `.p12` + the password to Doppler under:
   - `academorix-desktop/prd/APPLE_CERTIFICATE` (base64 blob:
     `base64 -w 0 cert.p12`).
   - `academorix-desktop/prd/APPLE_CERTIFICATE_PASSWORD` (the export password).
4. Grab the org's **Team ID** from the same Apple Developer page and store under
   `academorix-desktop/prd/APPLE_TEAM_ID`.
5. Create an **app-specific password** at
   [appleid.apple.com](https://appleid.apple.com) → "App-Specific Passwords" for
   `notary` and store under `academorix-desktop/prd/APPLE_PASSWORD`. Store the
   associated Apple ID email under `academorix-desktop/prd/APPLE_ID`.
6. Test the notarization pipeline manually before the first tagged release:

   ```bash
   # From the maintainer's laptop, on a signed DMG:
   xcrun notarytool submit \
     Academorix_0.1.0_x64.dmg \
     --apple-id "$APPLE_ID" \
     --team-id "$APPLE_TEAM_ID" \
     --password "$APPLE_PASSWORD" \
     --wait

   # If successful (Status: Accepted), staple the ticket so the app
   # launches without a network round-trip on first open:
   xcrun stapler staple Academorix_0.1.0_x64.dmg
   ```

### 1.2 Windows — EV code-signing cert

1. Buy an **EV Code Signing** cert (not standard OV) from SSL.com, Sectigo, or
   DigiCert — the EV type is what avoids SmartScreen warnings for new installs.
   Expect ~$300-$500/year.
2. Follow the vendor's HSM-based issuance (SafeNet USB or Azure Key Vault HSM).
   We use **Azure Key Vault HSM** so CI runners can sign without a physical
   dongle:
   - Provision a HSM key in the org's Azure subscription.
   - Import the cert.
   - Grant a **service principal** the "Sign" role.
3. Store the service principal credentials in Doppler:
   - `academorix-desktop/prd/AZURE_CLIENT_ID`
   - `academorix-desktop/prd/AZURE_CLIENT_SECRET`
   - `academorix-desktop/prd/AZURE_TENANT_ID`
   - `academorix-desktop/prd/AZURE_KEY_VAULT_URI`
   - `academorix-desktop/prd/AZURE_CERT_NAME`
4. The `signtool.exe`-compatible signing wrapper is
   [`AzureSignTool`](https://github.com/vcsjones/AzureSignTool). The
   `desktop-release.yml` workflow installs it via `dotnet tool` before the
   `tauri build` step:

   ```powershell
   dotnet tool install --global AzureSignTool
   AzureSignTool sign `
     -kvu "$env:AZURE_KEY_VAULT_URI" `
     -kvi "$env:AZURE_CLIENT_ID" `
     -kvs "$env:AZURE_CLIENT_SECRET" `
     -kvt "$env:AZURE_TENANT_ID" `
     -kvc "$env:AZURE_CERT_NAME" `
     -tr http://timestamp.digicert.com `
     -td sha256 `
     "target\release\bundle\msi\Academorix_0.1.0_x64_en-US.msi"
   ```

### 1.3 Linux — GPG signing (optional)

Linux artefacts (`.AppImage`, `.deb`) are unsigned in Phase 1. We publish
SHA-256 checksums alongside every release so users can verify integrity:

```bash
shasum -a 256 Academorix_0.1.0_amd64.AppImage > SHA256SUMS
```

When we ship to distro repos (Snap, Flatpak — see DESKTOP_PLAN §8) we add GPG
signing at that step.

### 1.4 Auto-updater signing key (Tauri-native, all OSes)

The updater plugin uses a separate Ed25519 keypair — independent of the OS-level
code-signing certs above.

1. Generate the keypair once with the Tauri CLI:

   ```bash
   pnpm --filter @academorix/dashboard exec tauri signer generate \
     -w /tmp/academorix-updater.key
   ```

2. Store the private key in Doppler:
   - `academorix-desktop/prd/TAURI_SIGNING_PRIVATE_KEY` — base64 blob.
   - `academorix-desktop/prd/TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — password you
     set at generation.

3. Copy the public key into `apps/dashboard/src/config/desktop.config.ts` →
   `updater.publicKey`. Every release binary embeds the public key at build
   time; the updater plugin refuses to install a payload it can't verify.

4. Delete the keypair from local disk (`shred -u /tmp/academorix-updater.key*`)
   as soon as it's in Doppler. **The private key is unrecoverable if lost —
   users on the old release cannot upgrade to a new one signed with a fresh
   key.** Back it up to the org's 1Password vault too.

---

## 2. Auto-update hosting

### 2.1 Manifest endpoint

Host at **`https://updates.academorix.com`** on Vercel Edge. Route table:

| Path                                                              | Response                                        |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `/dashboard/{target}/{arch}/{current-version}`                    | JSON manifest per DESKTOP_PLAN.md §4.6.         |
| `/dashboard/latest`                                               | 302 redirect to the latest per-platform bundle. |
| `/dashboard/downloads/{version}/Academorix_{version}_{...}.{ext}` | Signed installer artifact.                      |

Implementation lives in a small Vercel Edge Function fronting an S3-compatible
bucket (Cloudflare R2 today — free egress on the GitHub Actions runner IPs).

### 2.2 Bucket layout

```
r2://academorix-desktop-updates/
├── dashboard/
│   ├── manifests/
│   │   ├── 0.1.0.json                (canonical per-version manifest)
│   │   └── latest.json               (points at the newest release)
│   └── downloads/
│       └── 0.1.0/
│           ├── Academorix_0.1.0_x64.dmg
│           ├── Academorix_0.1.0_x64.app.tar.gz
│           ├── Academorix_0.1.0_x64.app.tar.gz.sig
│           ├── Academorix_0.1.0_aarch64.dmg
│           ├── Academorix_0.1.0_aarch64.app.tar.gz
│           ├── Academorix_0.1.0_aarch64.app.tar.gz.sig
│           ├── Academorix_0.1.0_x64-setup.exe
│           ├── Academorix_0.1.0_x64-setup.nsis.zip
│           ├── Academorix_0.1.0_x64-setup.nsis.zip.sig
│           ├── Academorix_0.1.0_amd64.AppImage
│           ├── Academorix_0.1.0_amd64.AppImage.tar.gz
│           ├── Academorix_0.1.0_amd64.AppImage.tar.gz.sig
│           └── SHA256SUMS
```

The Edge Function reads the latest manifest for the requested `{target}/{arch}`
combination and rewrites the download URLs to public bucket paths (or 302s to
CloudFront if we ever front R2 with it).

### 2.3 Manifest schema

The updater endpoint MUST return the exact schema documented in
`DESKTOP_PLAN.md` §4.6. Any drift makes the updater plugin fall back to "no
update available" silently.

Example (`0.2.0.json`):

```json
{
  "version": "0.2.0",
  "notes": "Bugfixes + performance improvements.",
  "pub_date": "2026-07-10T09:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://updates.academorix.com/dashboard/downloads/0.2.0/Academorix_0.2.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://updates.academorix.com/dashboard/downloads/0.2.0/Academorix_0.2.0_aarch64.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://updates.academorix.com/dashboard/downloads/0.2.0/Academorix_0.2.0_x64-setup.nsis.zip"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://updates.academorix.com/dashboard/downloads/0.2.0/Academorix_0.2.0_amd64.AppImage.tar.gz"
    }
  }
}
```

The `signature` is the base64-encoded Ed25519 signature the updater plugin
verifies against the public key baked into the binary.

---

## 3. Doppler secrets reference

Every value the desktop release workflow needs, mapped to its Doppler key.

| GitHub Actions env var               | Doppler project      | Doppler config | Doppler secret name                                 |
| ------------------------------------ | -------------------- | -------------- | --------------------------------------------------- |
| `TAURI_SIGNING_PRIVATE_KEY`          | `academorix-desktop` | `prd`          | `TAURI_SIGNING_PRIVATE_KEY`                         |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | `academorix-desktop` | `prd`          | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`                |
| `APPLE_CERTIFICATE`                  | `academorix-desktop` | `prd`          | `APPLE_CERTIFICATE` (base64 .p12)                   |
| `APPLE_CERTIFICATE_PASSWORD`         | `academorix-desktop` | `prd`          | `APPLE_CERTIFICATE_PASSWORD`                        |
| `APPLE_ID`                           | `academorix-desktop` | `prd`          | `APPLE_ID`                                          |
| `APPLE_PASSWORD`                     | `academorix-desktop` | `prd`          | `APPLE_PASSWORD` (app-specific pw)                  |
| `APPLE_TEAM_ID`                      | `academorix-desktop` | `prd`          | `APPLE_TEAM_ID`                                     |
| `AZURE_CLIENT_ID`                    | `academorix-desktop` | `prd`          | `AZURE_CLIENT_ID`                                   |
| `AZURE_CLIENT_SECRET`                | `academorix-desktop` | `prd`          | `AZURE_CLIENT_SECRET`                               |
| `AZURE_TENANT_ID`                    | `academorix-desktop` | `prd`          | `AZURE_TENANT_ID`                                   |
| `AZURE_KEY_VAULT_URI`                | `academorix-desktop` | `prd`          | `AZURE_KEY_VAULT_URI`                               |
| `AZURE_CERT_NAME`                    | `academorix-desktop` | `prd`          | `AZURE_CERT_NAME`                                   |
| `R2_ACCESS_KEY_ID`                   | `academorix-desktop` | `prd`          | `R2_ACCESS_KEY_ID`                                  |
| `R2_SECRET_ACCESS_KEY`               | `academorix-desktop` | `prd`          | `R2_SECRET_ACCESS_KEY`                              |
| `R2_BUCKET`                          | `academorix-desktop` | `prd`          | `R2_BUCKET` (default: `academorix-desktop-updates`) |
| `R2_ENDPOINT`                        | `academorix-desktop` | `prd`          | `R2_ENDPOINT` (Cloudflare S3-compat URL)            |

Mirror the same set under `stg` (staging) for pre-release testing. Never use prd
creds on a feature branch.

---

## 4. GitHub Actions workflow

`.github/workflows/desktop-release.yml` — tag-triggered matrix build. The
workflow lives in `.github/workflows/` at the workspace root; the canonical
version is committed alongside the code so a maintainer can audit any behaviour
change through Git history.

### 4.1 Trigger

```yaml
on:
  push:
    tags: ["v*.*.*"]
```

Only annotated tags matching semver kick a signed release. Force-push protection
lives at the branch-protection layer, not here — CI trusts the tagger.

### 4.2 Matrix

```yaml
jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-14 # Apple Silicon
            target: aarch64-apple-darwin
          - platform: macos-13 # Intel
            target: x86_64-apple-darwin
          - platform: windows-2022
            target: x86_64-pc-windows-msvc
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
    runs-on: ${{ matrix.platform }}
```

`fail-fast: false` so a broken Linux runner doesn't cancel the macOS + Windows
jobs — the release goes out with the platforms that succeeded.

### 4.3 Steps

Every job follows the same shape:

1. **Checkout + toolchain.** Node 24, pnpm 10, Rust stable.
2. **Doppler login.** OIDC exchange with GitHub Actions — no static token.
   Doppler service account is called `academorix-desktop-ci`.
3. **Install deps.** `pnpm install --frozen-lockfile`.
4. **Sync desktop config.**
   `pnpm --filter @academorix/dashboard sync:desktop-config` so the Rust
   `build.rs` reads the freshest snapshot.
5. **Platform-specific pre-build:**
   - macOS: `security import` the .p12 into a temporary keychain, unlock, add to
     search list.
   - Windows: `dotnet tool install --global AzureSignTool`.
6. **Build.**
   `pnpm --filter @academorix/dashboard tauri:build --target <triple>`. The
   Tauri CLI honours `TAURI_SIGNING_PRIVATE_KEY` from the env so the updater
   signatures are generated in-band.
7. **Sign.** macOS: `codesign` runs inside `tauri build`. Windows:
   `AzureSignTool sign` on the resulting `.msi` + `.exe`.
8. **Notarize (macOS only).**
   `xcrun notarytool submit --wait --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_PASSWORD" <dmg>`
   then `xcrun stapler staple <dmg>`.
9. **Upload to R2.** Use `rclone` (S3-compatible) with the R2 credentials from
   Doppler. Never `aws s3` — the AWS SDK auto-discovers the wrong endpoint and
   cross-contaminates other S3 credentials on the runner.
10. **Refresh manifest.** Overwrite `manifests/latest.json` in R2 with the new
    version. The updater plugin picks it up within the 4h poll window on running
    clients.
11. **Create GitHub Release.** `gh release create` with every artifact attached.
    Draft state until the maintainer publishes — gives us a review gate before
    the release notifies users.

### 4.4 Notarization gotchas

- **Stapling fails silently** when the notarization returned a warning. Always
  check `notarytool log` before assuming success:

  ```bash
  xcrun notarytool log \
    <submission-id> \
    --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_PASSWORD"
  ```

- Common failure: `The signature does not include a secure timestamp`. Fix: pass
  `--options runtime,timestamp` to `codesign`. Tauri v2 does this by default;
  explicit override lives in `tauri.conf.json` →
  `bundle.macOS.hardenedRuntime: true`.

- **Notarization latency**: Apple's median turnaround is 5-15 minutes; during
  high-traffic periods (Xcode releases) it can spike to hours. The workflow uses
  `--wait` so the job pins on the notary call — if it exceeds 30 minutes the
  runner times out and the release goes through the manual path (§6.2).

### 4.5 CSR / renewal cadence

- Apple Developer ID: renew annually. Notify the maintainer 30 days before
  expiry via a scheduled workflow that reads the cert's `notBefore` / `notAfter`
  from Doppler and posts to `#ops-alerts`.
- Azure Key Vault cert: renew per the CA's cycle (typically 1-3 years for EV
  certs).
- Tauri updater key: never rotate unless compromised. Rotating it breaks the
  update path for every installed client — see §7 for the full rotation runbook.

---

## 5. Release checklist

Before pushing a `v*` tag:

1. Bump `apps/dashboard/package.json` → `version`.
2. Bump `apps/dashboard/src-tauri/tauri.conf.json` → `version` to match.
3. Bump `apps/dashboard/src-tauri/Cargo.toml` → `version` to match.
4. Run `pnpm --filter @academorix/dashboard sync:desktop-config` locally to
   confirm the JSON snapshot is up to date.
5. Add a changelog entry to `apps/dashboard/CHANGELOG.md` (create the file on
   first release).
6. Locally: `pnpm --filter @academorix/dashboard tauri:build`. Even if CI does
   the signed build, a maintainer must confirm the local build produces the
   expected artefacts before the tag lands.
7. Commit the version bumps + changelog on `main` via PR.
8. Once merged, tag from `main`:

   ```bash
   git switch main
   git pull --ff-only
   git tag -s v0.1.0 -m "Academorix Desktop 0.1.0"
   git push origin v0.1.0
   ```

9. The `desktop-release.yml` workflow picks up the tag and:
   - Builds unsigned artifacts on all four matrix targets.
   - Signs each artifact with the appropriate cert (macOS notarization
     included).
   - Uploads to R2 + creates a GitHub Release **in draft state** with the same
     artifacts attached.
   - Updates `manifests/latest.json` in R2 so the auto-updater picks up the new
     version within the poll interval.

10. Maintainer reviews the draft release + verifies by installing on fresh
    macOS, Windows, Linux VMs. **Do not rely on your dev machine — the
    notarization ticket is cached locally and can hide a broken submission.**

11. Publish the GitHub Release to broadcast the update.

---

## 6. Rollback

### 6.1 Recall a broken release

If a release ships with a regression:

1. **Do not** delete the R2 objects — old versions remain reachable via direct
   URL for support triage.
2. Remove the manifest for the bad version from R2
   (`dashboard/manifests/{bad-version}.json`).
3. Rewrite `manifests/latest.json` to point at the last known-good version:

   ```bash
   rclone copyto \
     "r2:academorix-desktop-updates/dashboard/manifests/0.1.0.json" \
     "r2:academorix-desktop-updates/dashboard/manifests/latest.json"
   ```

4. New clients will keep polling and stop seeing the bad version. Clients that
   already installed the bad build stay on it until the NEXT good release ships.
   There is intentionally no downgrade path — the updater plugin refuses to
   install an older version to avoid state-file corruption (Tauri's own
   guardrail).

5. Communicate via the in-app notifications broadcast channel (`system`
   category) — the renderer implementation lives in `src/notifications/**` and
   the native-side bridge in `src-tauri/src/notification.rs`.

### 6.2 Manual release (bypass CI)

When CI is broken and the release must ship (security patch, weekend outage):

```bash
# Ensure Doppler is auth'd and the current run environment has the
# platform-specific tooling.
doppler run --project academorix-desktop --config prd -- \
  pnpm --filter @academorix/dashboard tauri:build --target aarch64-apple-darwin

# Sign + notarize outside CI. Use the same commands as §4.
xcrun notarytool submit apps/dashboard/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Academorix_0.2.0_aarch64.dmg \
  --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_PASSWORD" --wait
xcrun stapler staple apps/dashboard/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Academorix_0.2.0_aarch64.dmg

# Upload + refresh the manifest.
rclone copy apps/dashboard/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/ \
  "r2:academorix-desktop-updates/dashboard/downloads/0.2.0/"
rclone copyto ./manifests/0.2.0.json \
  "r2:academorix-desktop-updates/dashboard/manifests/0.2.0.json"
```

Document any manual release in the postmortem log so CI can be fixed before the
next scheduled cut.

---

## 7. Key rotation

The Tauri updater key is a **long-lived credential**. Rotation breaks the
auto-update chain for every installed client — the plugin refuses to install a
payload signed with a key it doesn't recognise.

Rotation is a two-release dance:

1. **Cut a bridge release** `x.y.z-bridge`. This release ships:
   - The OLD public key (verifies the update payload the running client
     received).
   - The NEW public key bundled in `desktopConfig.updater.publicKey`. The bridge
     release itself is signed with the OLD private key so running clients accept
     it.

2. **Wait for the poll interval** (4h at minimum; realistically a few days to
   give users a chance to launch the app).

3. **Cut the next release** `x.y+1.0` signed with the NEW private key. Every
   client that received the bridge now accepts payloads signed with the new key.

Clients that skipped the bridge release (installed something before, opened it
later, missed the poll window) can't auto-update to the new key. They must
download the `x.y+1.0` installer manually. Communicate via the marketing site +
broadcast notifications.

Never rotate keys unless the private key is confirmed compromised.

---

## 8. Sanity smoke tests

Every release, on a fresh VM per platform, walk this checklist:

1. **First launch.**
   - Welcome window opens (480×360, brand mark, two buttons).
   - Clicking `Sign in` closes the welcome window and lands on `/login`.
   - Clicking `Create a workspace` opens the default browser to the marketing
     site's create-workspace form.
   - Tray icon appears in the menu bar (macOS) / system tray (Windows) /
     top-panel (Linux where the DE renders it).

2. **Deep link.** With the app closed, open a link like
   `academorix://workspace/nike/dashboard` from the OS shell. The app launches,
   raises, and lands on `/nike/dashboard`.

3. **Global shortcut.** Press `Cmd/Ctrl+Shift+A` from a different app.
   Academorix raises to the foreground.

4. **Native notification.** Trigger any notification from Settings → Test → Send
   Test Notification. It renders through the OS surface (Notification Center on
   macOS, Action Center on Windows, DBus/notify-send on Linux).

5. **Auto-update.** Point the runner at a staging manifest URL that advertises
   `x.y.z+1`. Confirm the update toast appears within the configured poll
   interval, the "Install and restart" action triggers the download + relaunch,
   and the new version starts up cleanly.

6. **Menu bar.**
   - macOS: `Academorix` submenu shows About / Preferences / Quit.
     `File > New Athlete` fires the same action as the sidebar entry.
   - Windows / Linux: menu bar renders inside the main window's title strip.
   - `Cmd/Ctrl+K` opens the palette from any focus state.

If any step fails, roll back per §6.1 and file a bug against the release.

---

## 9. Support artefacts

Every issue triage request from a user includes:

- **Version banner.** Settings → About shows the running build's version +
  platform + Rust toolchain hash.
- **Diagnostic bundle.** Settings → Advanced → Export Diagnostics (Phase 3 —
  TODO). Ships logs from `~/Library/Logs/Academorix/` (macOS),
  `%APPDATA%\Academorix\logs\` (Windows), or `$XDG_DATA_HOME/Academorix/logs/`
  (Linux).
- **Auto-update status.** Settings → Advanced → Check for updates — fires an
  immediate poll + reports the response. Useful when a user claims the update
  never landed.

---

## 10. Related documents

- [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — architecture, phased rollout, and
  integration points. Includes the auto-update manifest schema referenced in
  §5.2 of this runbook.
- [`DASHBOARD_UX_PLAN.md`](./DASHBOARD_UX_PLAN.md) — the SPA UX spec that the
  desktop shell wraps.

Implementation entry points for the surfaces that were previously covered by
separate plans:

- Native menu bar — `src/config/menu.config.ts`, `src/desktop/native-menu.ts`,
  `src-tauri/src/menu.rs`.
- Notifications (in-app, web push, native) — `src/notifications/**`,
  `src-tauri/src/notification.rs`.
- Desktop first-run UX (welcome window, tray coachmark, global shortcut
  coachmark) — `src/onboarding/**` + `src/desktop/**`.
