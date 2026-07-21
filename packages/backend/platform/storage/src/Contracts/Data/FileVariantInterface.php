<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Data;

use Stackra\Storage\Models\FileVariant;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `file_variants` table.
 *
 * Derived rendition of a {@see FileInterface} — thumbnails, medium
 * / hero image sizes, pdf-thumbnails. Regeneratable, hard-deleted
 * with the parent.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(FileVariant::class)]
interface FileVariantInterface
{
    public const string TABLE = 'file_variants';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'fvr';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                      = 'id';
    public const string ATTR_FILE_ID                 = 'file_id';
    public const string ATTR_TENANT_ID               = 'tenant_id';
    public const string ATTR_VARIANT_KEY             = 'variant_key';
    public const string ATTR_GENERATED_BY_CONVERSION = 'generated_by_conversion';
    public const string ATTR_MIME_TYPE               = 'mime_type';
    public const string ATTR_WIDTH                   = 'width';
    public const string ATTR_HEIGHT                  = 'height';
    public const string ATTR_SIZE_BYTES              = 'size_bytes';
    public const string ATTR_DISK                    = 'disk';
    public const string ATTR_PATH                    = 'path';
    public const string ATTR_GENERATED_AT            = 'generated_at';
    public const string ATTR_METADATA                = 'metadata';
    public const string ATTR_CREATED_BY              = 'created_by';
    public const string ATTR_UPDATED_BY              = 'updated_by';
    public const string ATTR_CREATED_AT              = 'created_at';
    public const string ATTR_UPDATED_AT              = 'updated_at';
}
