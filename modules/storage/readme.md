# storage

File upload + attachment substrate. Wave 3 infrastructure (priority 24). Wraps
`spatie/laravel-medialibrary` and adds the workspace-scope, entitlement,
antivirus, signed-URL, and chunked-upload layers Laravel Storage doesn't
provide.

## 1. Why not "just use Laravel Storage"

Laravel's `Storage` facade is a **filesystem abstraction**. This module is a
**domain layer** on top. The two solve different problems.

Laravel Storage owns: driver abstraction (local / S3 / GCS / Azure), byte
put/get, streaming, MIME sniff via `mimeType()`.

This module owns:

| Concern                                                                     | Why Storage can't handle it alone                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `File` Eloquent model with owner + workspace + kind + SHA-256 + virus state | Storage returns paths, not domain records            |
| Workspace-scoped path isolation on shared buckets                           | Storage doesn't know about tenants                   |
| SHA-256 content-addressable dedup + refcount                                | Storage overwrites on same-path put                  |
| Uniform signed URLs across drivers with audit trail                         | S3 pre-signed URLs are provider-native and unaudited |
| Antivirus scan pipeline with `pending → clean → infected` state             | Storage puts the byte and forgets                    |
| Image variant generation (thumbnail / medium / hero)                        | No image processing                                  |
| Chunked / resumable uploads via tus.io / S3 multipart                       | Storage is a single-request API                      |
| Entitlement enforcement (`storage.bytes.consumed` pool)                     | Storage doesn't know quotas                          |
| MIME + size allow-list per file kind (avatar vs document vs media)          | Storage accepts any bytes                            |
| CDN URL rewriting (S3 → CloudFront)                                         | Storage returns raw driver URLs                      |
| Retention windows + cascade erase on workspace deletion                     | Storage doesn't run scheduled cleanup                |

Consumer modules NEVER call `Storage::disk()` directly. They compose the
`HasFiles` trait + declare `#[Attachable(kind: '...')]` and get workspace-aware
attachments for free.

## 2. Why wrap spatie/laravel-medialibrary

Same rationale as our other wraps (localization → spatie/laravel-translatable;
telemetry → keepsuit/laravel-opentelemetry). Reimplementing image conversions,
MIME sniffing, path management, and the `HasMedia` trait is 2-3k LOC we would
maintain forever. spatie ships all of it + is battle-tested (60M+ downloads).

We take their `HasMedia` and expose it under our name `HasFiles` (domain
clarity), add our companion tables (`file_variants` for our variant-tracking
model, `signed_url_audits` for the audit trail, `chunked_uploads` for the state
machine), and layer our workspace scoping + entitlement enforcement + antivirus
state on top. Their `media` table stays as the physical file record; our `File`
Eloquent model is a subclass that adds our fields.

## 3. The four owned entities

**`File`** (`fil_` prefix). Every uploaded byte results in one row. Owns
`workspace_id`, `owner_id` (nullable — system uploads), polymorphic
`fileable_type`/`fileable_id` (nullable — files can exist unattached), `kind`
(via `FileKindRegistry`), `sha256`, `size_bytes`, `mime_type`,
`virus_scan_state`, `visibility`, `disk`, `path`. Composes `HasSystemFlag`,
`BelongsToWorkspace`, `HasMetadata`, `HasUserstamps`, `HasAuditable`,
`Filterable`, `SoftDeletes`.

**`FileVariant`** (`fvr_` prefix). Image or document derivatives generated async
by `GenerateFileVariantsJob`. One row per (file, variant_key). Owns `file_id`,
`workspace_id` (denormalised for scope queries), `variant_key` (`thumbnail` /
`medium` / `hero` / `webp` / …), `width` + `height` (for images), `size_bytes`,
`disk`, `path`, `generated_by_conversion`.

**`SignedUrlAudit`** (`sua_` prefix). Every issued signed URL. Owns `file_id`,
`workspace_id`, `issued_to_user_id` (nullable — anonymous share links), `reason`
(`download` / `preview` / `share` / `admin_action`), `ttl_seconds`,
`expires_at`, `hit_count`, `last_hit_at`, `ip_lock` (CIDR, nullable),
`user_lock` (ULID, nullable), `revoked_at`, `revoked_reason`.

**`ChunkedUpload`** (`cup_` prefix). In-flight multipart / tus.io state. Owns
`workspace_id`, `owner_id`, `upload_url`, `total_size_bytes`, `uploaded_bytes`,
`chunks` (JSONB of the per-chunk ledger), `state` (`initiating` / `uploading` /
`finalizing` / `completed` / `aborted` / `expired`), `expires_at`,
`resulting_file_id` (nullable, set on completion).

## 4. Attribute-driven attachments

Consumer modules opt in via three attributes. The compiler discovers them at
boot and registers with the `FileKindRegistry` + attaches the `HasFiles` trait's
runtime plumbing.

```php
use Academorix\Storage\Attributes\{FileKind, Attachable, GeneratesVariants};
use Academorix\Storage\Concerns\HasFiles;

#[FileKind(
    key: 'avatar',
    max_size_mb: 5,
    allowed_mimes: ['image/jpeg', 'image/png', 'image/webp'],
    generates_variants: ['thumbnail', 'medium'],
    requires_virus_scan: true,
)]
final class Avatar {}

final class User extends Model
{
    use HasFiles;

    #[Attachable(kind: 'avatar')]
    #[GeneratesVariants(['thumbnail', 'medium'])]
    public function avatar()
    {
        return $this->fileOfKind('avatar');
    }
}
```

Runtime: `$user->avatar()` returns the resolved `File` (or null); the wire
projection surfaces `avatar_url` (active signed URL) + `avatar_variants` (map of
variant_key → signed URL).

## 5. Signed URL orchestrator

Every read is signed. The `SignedUrlIssuer` wraps the driver's temporary URL
support (S3 pre-signed, GCS signed URLs, local via our HMAC signature) so the
wire contract is uniform.

TTL policy from `module.json.signed_urls.ttl_policy`:

- **download** — 1h default, per-plan overridable
- **preview** — 5m (short-lived; view renews)
- **share** — 7d (external sharing; requires workspace admin permission)
- **admin_action** — 5m, one-time use, IP-locked to the platform-admin session

Every issued URL writes a `SignedUrlAudit` row. Hits update `hit_count` +
`last_hit_at` via `storage.audit-hit` middleware on the redemption route.
Revocation is a workspace admin action that writes `revoked_at` + emits
`SignedUrlRevoked`.

## 6. Chunked / resumable uploads

For uploads > 100MB (configurable), the client initiates a `ChunkedUpload`. Our
coordinator returns either a `tus.io` server URL or an S3 multipart URL
depending on driver. The client uploads chunks; each successful chunk PATCHes
the `ChunkedUpload` row with its index + SHA-256. On resume after crash, the
client asks `GET /api/v1/files/chunked/ {upload}` and receives the ledger of
missing chunks.

Finalisation runs `TusUploadFinalizerJob` which validates the reconstructed
SHA-256 against the client's declared hash, promotes the multipart object to a
canonical File row, and fires `ChunkedUploadCompleted` + `FileUploaded`.

State machine:
`initiating → uploading → finalizing → completed | aborted | expired`. Expiry
sweeps run daily via `PurgeAbortedChunkedUploadsJob`.

## 7. Content-addressable dedup

Every upload is hashed before commit. When a second workspace uploads a file
matching an existing blob's SHA-256:

- Both workspaces get their own `File` rows (ownership + policy stay
  workspace-scoped)
- Both rows point at the same physical blob path
- Both consume bytes against their respective entitlements (each workspace pays
  for the reference)
- The blob has a `reference_count` (managed by `ContentAddressableStore`);
  physical deletion happens only when the last referring File row is
  hard-deleted

Opt-out per kind via `#[FileKind(dedupable: false)]` — required when two
workspaces MUST NOT share physical bytes even if content matches
(cryptographically sensitive files, signed contracts with tenant-specific DRM).

## 8. Antivirus pipeline

Every upload goes through `ScanFileForVirusesJob` after the byte lands and
before the File row is marked `available`. State transitions:

`uploading → scanning → available` (happy path)

`uploading → scanning → quarantined` (virus detected — file moved to quarantine
disk, `FileVirusFound` fired, `FileQuarantinedNotification` dispatched to
workspace owners)

Scanner drivers: `clamav` (self-hosted), `s3-antivirus` (S3 lambda), `null` (dev
/ tests). Selection via `config('storage.antivirus.driver')`.

Files with `virus_scan_state != 'clean'` never get a signed URL — even for admin
download.

## 9. Entitlements consumed

Every upload calls `entitlements::consume()` with the file's byte count. The
storage module publishes:

- `storage.bytes.consumed` — pool, resets monthly OR at workspace anniversary
  (config), value = total bytes actively referenced by non-erased Files
- `storage.files.max_per_workspace` — slot, hard cap on File row count (rarely
  hit; primarily a defence against pathological upload floods)
- `storage.uploads.month` — pool, monthly upload count cap (defends against
  sustained abuse)

Overquota rejects at the middleware layer (`storage.quota.enforce`) with HTTP
402 `STORAGE_QUOTA_EXCEEDED` + error envelope pointing at the plan upgrade URL.

## 10. Wire projection

Every File on the wire looks like:

```json
{
  "id": "fil_01HXYZ...",
  "workspace_id": "wsp_01HXYZ...",
  "kind": "avatar",
  "filename": "profile.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 84329,
  "url": "https://cdn.academorix.app/…?signature=…&expires=…",
  "variants": {
    "thumbnail": "https://cdn.academorix.app/…thumb…?signature=…",
    "medium": "https://cdn.academorix.app/…medium…?signature=…"
  },
  "virus_scan_state": "clean",
  "created_at": "2026-07-14T18:52:03.421Z"
}
```

The `url` + `variants[*]` are pre-signed at wire-projection time (fresh
signature per response). `sha256`, `disk`, `path`, `owner_id` are
`x-wire.hidden` on the schema.

## 11. What this module does NOT do

- **Doesn't own the SDUI file-uploader widget.** That's `@academorix/ui` on the
  frontend; this module only owns the wire surface it consumes.
- **Doesn't do document search / OCR.** Full-text extraction from PDFs / DOCX
  lives in the `search` module (which subscribes to `FileUploaded` and extracts
  async).
- **Doesn't do transcoding.** Video / audio transcoding is a separate module
  (`transcoding`, not yet built) that subscribes to `FileUploaded` on video
  kinds.
- **Doesn't ship the antivirus binary.** ClamAV runs as a sidecar or an S3
  Lambda; this module owns the client + the state machine only.
- **Doesn't own signed URL redemption logic** for the `/files/{signature}`
  central-host route beyond signature verification + hit-count increment; the
  actual byte-serve is a Laravel Storage stream.

## 12. Files

Standard module blueprint. Schemas: 4 entities (`file`, `file-variant`,
`signed-url-audit`, `chunked-upload`). Data: `data/kinds.json` catalogue of the
default file kinds (avatar, document, image, video, attachment,
export-artifact).
