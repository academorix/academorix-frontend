# platform/storage — Phase 3 implementation status

## Status: PARTIAL — file upload + download + delete + chunked-upload lifecycle landed; virus-scan + variant pipeline pending

## What landed

### Aggregate

- `File` model + `FileInterface` column contract — S3-key + disk +
  path + sha256 + mime_type + size_bytes + visibility (`public` /
  `private`) + `fileable_type` + `fileable_id` polymorphic
  attachment + tenant-scoped. `virus_scan_state` field with the
  `pending` / `clean` / `infected` state machine.
- `ChunkedUpload` — server-side upload manifest for resumable
  uploads. `parts_received JSON` tracks per-chunk arrival.
- `FileVariant` — derived-artifact rows (thumbnails, WebP, PDF
  previews) attached to a parent `File`.
- `SignedUrl` — persisted signed-URL issuance record for audit +
  revocation.

### Actions (tenant surface)

- `UploadFile` (POST `/api/v1/files`) — single-request upload.
  SHA-256 dedup (returns the existing row when the tenant already
  has the same bytes). Multi-middleware pipeline:
  `storage.mime.validate` + `storage.size.validate` +
  `storage.quota.enforce` + `storage.tenant.scope`. Kicks the
  observer which enqueues the scan + variant jobs.
- `DownloadFile` (GET `/{file}/download`) — server-side stream with
  auth check.
- `IssueSignedUrl` (POST `/{file}/signed-url`) — issues a short-lived
  signed URL for direct download. Records the issuance in
  `signed_urls` for revocation.
- `RevokeSignedUrls` (POST `/{file}/signed-urls/revoke`) — bulk
  revocation.
- `InitiateChunkedUpload`, `UploadChunk`, `FinalizeChunkedUpload`,
  `AbortChunkedUpload` — resumable upload lifecycle. Each chunk
  writes to a staging prefix + tracks arrival in `parts_received`.
  Finalize concatenates + moves to the canonical `files/` path.
- `ShowFile`, `ListFiles`, `UpdateFile`, `DeleteFile` — CRUD.
- `ListVariants`, `ReprocessVariants` — variant management.

## What's pending

### Actions to complete

- `AttachToAction` (POST `/{file}/attach`) — polymorphic attach to a
  host aggregate. Currently the upload takes `fileable_type` +
  `fileable_id` on create; a POST-CREATE attach for late binding is
  missing.
- `PresignedDirectUploadAction` (POST `/api/v1/files/presigned`) —
  issues an S3 PUT presigned URL so the client uploads directly to
  S3 without proxying bytes through Laravel. Companion
  `RegisterFileAction` (POST `/api/v1/files/register`) that the
  client calls after the S3 PUT succeeds to persist the `files` row.
  This is the S3 canonical pattern for large uploads.
- `ScanAction` (POST `/{file}/scan`) — administrative rescan trigger
  (ClamAV integration).
- Platform-tier surface — cross-tenant listing / diagnostics for
  support. `ListFile` at `/api/v1/platform/files` with the
  `platform.storage.viewAny` gate.

### Services + jobs to complete

- `ScanFileForVirusesJob` — currently a stub. Should:
  1. Stream the file bytes to ClamAV (`clamdscan --stream`).
  2. Update `virus_scan_state` to `clean` / `infected`.
  3. On `infected`: emit `FileQuarantined`, revoke every issued
     signed URL, delete the S3 object, keep the row for audit.
- `GenerateFileVariantsJob` — derivations pipeline:
  - Images: thumbnail (200x200) + medium (800x600) + WebP.
  - PDFs: first-page thumbnail via `pdftoppm`.
  - Video: poster frame via `ffmpeg -ss 1 -vframes 1`.
  Each variant is a new `FileVariant` row + a stored S3 object.
- `PdfRendererService` — for tenant PDF generation (invoices,
  reports). Wraps `wkhtmltopdf` or Puppeteer via a worker container.
  Consumer: `finance/invoice` for invoice PDFs, `sports/*` for
  report cards.
- `StorageQuotaEnforcer` middleware — reads
  `tenant.storage_quota_bytes` from settings + refuses uploads that
  would exceed it. Currently the middleware exists but is a stub —
  wire the actual quota check.

### Domain events to dispatch

Per `modules/platform/blueprints/storage/events.json`:

- `FileUploaded` — from the observer after commit on create.
- `FileScanCompleted` (payload includes `scan_state`) — from the
  scan job.
- `FileQuarantined` — from the scan job on `infected`.
- `FileVariantsGenerated` — from the variants job.
- `SignedUrlIssued`, `SignedUrlRevoked` — from the respective
  actions.

### Cross-module dependencies

- **`compliance/compliance`** — DSAR export MUST include every file
  attached to the exported user + tenant. Register `File` as a
  DSAR contributor via `#[DsarExportable]`.
- **`platform/webhook`** — file uploads land under
  `/api/v1/files` with `X-Webhook-Signature` from external callers
  that provide direct integrations (S3 event notifications). Not
  urgent.

## Backlog priorities

1. **P0 — Virus-scan wiring.** The observer enqueues the job but
   the job is a stub. Without this, malware can be served to
   end-users.
2. **P0 — Variant pipeline.** Product surfaces (avatars, gallery,
   preview) can't render without thumbnails.
3. **P1 — Presigned direct-upload.** Blocking large-file support
   (>50MB) — the current single-request path buffers into memory.
4. **P2 — PDF renderer.** Blocking `finance/invoice` PDF generation.
