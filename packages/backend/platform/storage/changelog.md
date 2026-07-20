# storage — changelog

## Unreleased

### Added

- Initial `storage` module. Wave 3 infrastructure (priority 24). Wraps
  `spatie/laravel-medialibrary ^11` and adds the tenant-scope + entitlement +
  antivirus + signed-URL + chunked-upload layers.
- Four owned entities: `File` (fil_ prefix), `FileVariant` (fvr_),
  `SignedUrlAudit` (sua_), `ChunkedUpload` (cup_).
- Two owned traits: `HasFiles` (consumer models compose to gain attachments),
  `IsFile` (marker on the File model itself).
- Four PHP attributes: `#[Attachable]`, `#[FileKind]`, `#[GeneratesVariants]`,
  `#[RequiresVirusScan]`.
- Content-addressable dedup via SHA-256 with per-blob refcount; opt-out per file
  kind for cryptographically sensitive content.
- Chunked / resumable uploads via tus.io v1.0.0 + S3 multipart.
- Antivirus state machine with ClamAV + S3-antivirus drivers.
- Signed URL orchestrator uniform across drivers (local dev + S3 + GCS + Azure)
  with per-issuance audit trail + revocation.
- Three entitlements: `storage.bytes.consumed` (pool),
  `storage.files.max_per_tenant` (slot), `storage.uploads.month` (pool).

### Migration path for consumer modules

Modules that today read/write via `Storage::disk()` directly must migrate to the
`HasFiles` trait + `#[Attachable]` attribute. See §4 in the readme for the
migration recipe. The `Storage` facade is no longer a supported downstream
surface.

### ULID prefixes registered

Added to `modules/shared/foundation/data/ulid-prefixes.json`:

- `fil_` — File
- `fvr_` — FileVariant
- `sua_` — SignedUrlAudit
- `cup_` — ChunkedUpload
