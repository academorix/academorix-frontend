# Academorix Desktop — Ops Runbook

> Status: **draft** · Owner: platform team.
>
> How ops obtains certs, hosts the auto-update manifest, and wires GitHub
> Actions for signed releases. Every credential referenced below is stored in
> **Doppler** — this doc names the keys, never the values.
>
> Companion to [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — read it first for the
> architecture. This file only covers Phase 4 (auto-update) and Phase 5
> (signing + distribution) operational steps.

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
   - `academorix-desktop/prd/APPLE_CERTIFICATE` (base64 blob).
   - `academorix-desktop/prd/APPLE_CERTIFICATE_PASSWORD` (the export password).
4. Grab the org's **Team ID** from the same Apple Developer page and store under
   `academorix-desktop/prd/APPLE_TEAM_ID`.
5. Create an **app-specific password** at
   [appleid.apple.com](https://appleid.apple.com) → "App-Specific Passwords" for
   `notary` and store under `academorix-desktop/prd/APPLE_PASSWORD`. Store the
   associated Apple ID email under `academorix-desktop/prd/APPLE_ID`.
6. Test the notarization pipeline manually before the first tagged release:

   ```bash
   xcrun notarytool submit \
     Academorix_0.1.0_x64.dmg \
     --apple-id "$APPLE_ID" \
     --team-id "$APPLE_TEAM_ID" \
     --password "$APPLE_PASSWORD" \
     --wait
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
   `desktop-release.yml` workflow (below) installs it via `dotnet tool` before
   the `tauri build` step.

### 1.3 Auto-updater signing key (Tauri-native, all OSes)

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
│   │   └── 0.1.0.json                (canonical per-version manifest)
│   └── downloads/
│       └── 0.1.0/
│           ├── Academorix_0.1.0_x64.dmg
│           ├── Academorix_0.1.0_x64.app.tar.gz
│           ├── Academorix_0.1.0_x64.app.tar.gz.sig
│           ├── Academorix_0.1.0_x64-setup.exe
│           ├── Academorix_0.1.0_x64-setup.nsis.zip
│           ├── Academorix_0.1.0_x64-setup.nsis.zip.sig
│           ├── Academorix_0.1.0_amd64.AppImage
│           ├── Academorix_0.1.0_amd64.AppImage.tar.gz
│           └── Academorix_0.1.0_amd64.AppImage.tar.gz.sig
```

The Edge Function reads the latest manifest for the requested `{target}/{arch}`
combination and rewrites the download URLs to public bucket paths (or 302s to
CloudFront if we ever front R2 with it).

### 2.3 Manifest schema

The updater endpoint MUST return the exact schema documented in
`DESKTOP_PLAN.md` §4.6. Any drift makes the updater plugin fall back to "no
update available" silently.

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
| `WINDOWS_CERT_PASSWORD`              | `academorix-desktop` | `prd`          | `WINDOWS_CERT_PASSWORD`                             |
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

## 4. Release checklist

Before pushing a `v*` tag:

1. Bump `apps/dashboard/package.json` → `version`.
2. Bump `apps/dashboard/src-tauri/tauri.conf.json` → `version` to match.
3. Run `pnpm --filter @academorix/dashboard sync:desktop-config` locally to
   confirm the JSON snapshot is up to date.
4. Add a changelog entry to `apps/dashboard/CHANGELOG.md` (create the file on
   first release).
5. Commit + push a signed annotated tag: `git tag -s v0.1.0 -m "0.1.0"`.
6. The `desktop-release.yml` workflow picks up the tag and:
   - Builds unsigned artifacts on all three OSes.
   - Signs each artifact with the appropriate cert (macOS notarization
     included).
   - Uploads to R2 + creates a GitHub Release with the same artifacts attached.
   - Updates `manifests/latest.json` in R2 so the auto-updater picks up the new
     version within the poll interval.
7. Verify by installing the new build on a fresh macOS / Windows / Linux VM.
   **Do not rely on your dev machine — the notarization ticket is cached locally
   and can hide a broken submission.**

---

## 5. Rollback

If a release ships with a regression:

1. **Do not** delete the R2 objects — old versions remain reachable via direct
   URL for support triage.
2. Remove the manifest for the bad version from R2
   (`dashboard/manifests/{bad-version}.json`). The updater falls back to the
   next-oldest manifest still present.
3. Rewrite `manifests/latest.json` to point at the last known-good version.
4. Communicate via the in-app notifications broadcast channel (`system`
   category) — see `NOTIFICATIONS_PLAN.md` §7.
