<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Data;

use Stackra\Storage\Models\File;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `files` table.
 *
 * Primary domain entity of the storage module. One row per uploaded
 * byte-stream. Polymorphic (`fileable_type` / `fileable_id`) so any
 * consumer model can attach files via `HasFiles`. Content-addressable
 * via `sha256` with per-blob refcount so two tenants uploading the
 * same PDF share physical bytes but hold separate rows.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(File::class)]
interface FileInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'files';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — `fil_<26 chars>`.
     */
    public const string ID_PREFIX = 'fil';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_TENANT_ID           = 'tenant_id';
    public const string ATTR_OWNER_ID            = 'owner_id';
    public const string ATTR_FILEABLE_TYPE       = 'fileable_type';
    public const string ATTR_FILEABLE_ID         = 'fileable_id';
    public const string ATTR_KIND                = 'kind';
    public const string ATTR_COLLECTION          = 'collection';
    public const string ATTR_FILENAME            = 'filename';
    public const string ATTR_NAME                = 'name';
    public const string ATTR_MIME_TYPE           = 'mime_type';
    public const string ATTR_SIZE_BYTES          = 'size_bytes';
    public const string ATTR_SHA256              = 'sha256';
    public const string ATTR_DISK                = 'disk';
    public const string ATTR_PATH                = 'path';
    public const string ATTR_VISIBILITY          = 'visibility';
    public const string ATTR_VIRUS_SCAN_STATE    = 'virus_scan_state';
    public const string ATTR_VIRUS_SCAN_DETAILS  = 'virus_scan_details';
    public const string ATTR_SCANNED_AT          = 'scanned_at';
    public const string ATTR_DEDUPABLE           = 'dedupable';
    public const string ATTR_REFERENCE_COUNT     = 'reference_count';
    public const string ATTR_GENERATED_VARIANTS  = 'generated_variant_keys';
    public const string ATTR_IS_SYSTEM           = 'is_system';
    public const string ATTR_ORIGINAL_URL        = 'original_url';
    public const string ATTR_ARCHIVED_AT         = 'archived_at';
    public const string ATTR_CUSTOM_PROPERTIES   = 'custom_properties';
    public const string ATTR_METADATA            = 'metadata';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_DELETED_BY          = 'deleted_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
    public const string ATTR_DELETED_AT          = 'deleted_at';
}
