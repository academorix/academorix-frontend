<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Data;

use Academorix\Storage\Models\ChunkedUpload;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `chunked_uploads` table.
 *
 * In-flight multipart / tus.io state. Reconnect-safe via a per-chunk
 * ledger stored in JSONB. State machine: `initiating` → `uploading`
 * → `finalizing` → `completed | aborted | expired`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(ChunkedUpload::class)]
interface ChunkedUploadInterface
{
    public const string TABLE = 'chunked_uploads';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'chu';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_OWNER_ID              = 'owner_id';
    public const string ATTR_TARGET_KIND           = 'target_kind';
    public const string ATTR_TARGET_FILEABLE_TYPE  = 'target_fileable_type';
    public const string ATTR_TARGET_FILEABLE_ID    = 'target_fileable_id';
    public const string ATTR_PROTOCOL              = 'protocol';
    public const string ATTR_UPLOAD_URL            = 'upload_url';
    public const string ATTR_PROVIDER_UPLOAD_ID    = 'provider_upload_id';
    public const string ATTR_FILENAME              = 'filename';
    public const string ATTR_DECLARED_MIME_TYPE    = 'declared_mime_type';
    public const string ATTR_DECLARED_SHA256       = 'declared_sha256';
    public const string ATTR_TOTAL_SIZE_BYTES      = 'total_size_bytes';
    public const string ATTR_UPLOADED_BYTES        = 'uploaded_bytes';
    public const string ATTR_CHUNKS                = 'chunks';
    public const string ATTR_CHUNK_SIZE_BYTES      = 'chunk_size_bytes';
    public const string ATTR_STATE                 = 'state';
    public const string ATTR_EXPIRES_AT            = 'expires_at';
    public const string ATTR_INITIATED_AT          = 'initiated_at';
    public const string ATTR_FINALIZED_AT          = 'finalized_at';
    public const string ATTR_ABORT_REASON          = 'abort_reason';
    public const string ATTR_RESULTING_FILE_ID     = 'resulting_file_id';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
