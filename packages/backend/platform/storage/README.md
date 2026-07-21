# stackra/storage

File-upload substrate for every Stackra tenant. Wraps
`spatie/laravel-medialibrary ^11` and adds the tenant-scoping, entitlement
enforcement, antivirus pipeline, audited signed-URL orchestrator, chunked-upload
state machine, image variants, and content-addressable dedup that our
multi-tenant SaaS actually needs.

## Aggregates

| Aggregate        | ULID prefix | Purpose                                                                                                       |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `File`           | `fil_`      | Polymorphic file record via `fileable_type` / `fileable_id`. One row per uploaded byte-stream; tenant-scoped. |
| `FileVariant`    | `fvr_`      | Derived rendition of a `File` (thumbnail / medium / hero / pdf-thumbnail). Regeneratable — hard-deleted.      |
| `SignedUrlAudit` | `sua_`      | One row per signed URL issued (TTL / IP lock / user lock / hit count). Powers revocation + abuse detection.   |
| `ChunkedUpload`  | `chu_`      | In-flight multipart / tus.io state. Reconnect-safe via per-chunk ledger.                                      |

## Install

```bash
composer require stackra/storage
```

Auto-registers via `extra.laravel.providers`.

## Blueprint

The wire contract lives at `modules/platform/blueprints/storage/`.

## Contributes

- **Contracts (framework-swappable)** — `AntivirusScannerInterface`,
  `SignedUrlIssuerInterface`, `VariantGeneratorInterface`,
  `ChunkedUploadCoordinatorInterface`, `ContentAddressableStoreInterface`,
  `CdnUrlRewriterInterface`, `FileKindRegistryInterface`,
  `MimeTypeAllowlistInterface`. Every default is a safe no-op or a
  Laravel-Storage-backed shim — consumer apps bind their concrete provider via
  `#[Bind]`.
- **Permissions** — `StoragePermission` (dual-guard: view/manage on the
  `platform_admin` guard; tenant.manage/tenant.upload on `sanctum`).
- **Traits** — `HasFiles` for consumer models, `IsFile` marker.
- **Attributes** — `#[Attachable]`, `#[FileKind]`, `#[GeneratesVariants]`,
  `#[RequiresVirusScan]`.
- **Events (15)** — full file lifecycle plus quota + signed-URL signals.
- **Jobs (8)** — antivirus, variants, retention, dedup, quota sync.
- **Commands (7)** — describe, reprocess-variants, rescan-virus, purge-orphans,
  reconcile-quota, dedup-audit, signed-url-revoke-all.
- **Middleware (5)** — mime + size + quota + antivirus + tenant-scope guards.

## Chunked upload note

Large uploads (> 100MB by default) route through a tus.io / S3 multipart flow.
`ChunkedUpload` rows carry the per-chunk ledger so a client resuming after a
network drop re-uploads only what's missing. State machine:
`initiating → uploading → finalizing → completed | aborted | expired`. See
`Services/DefaultChunkedUploadCoordinator`.

## Tests

```bash
composer install
vendor/bin/pest
```
