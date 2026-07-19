<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Data;

use Academorix\Transfer\Models\XferArtifact;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `xfer_artifacts` table.
 *
 * File output ledger — one row per generated file (result / errors /
 * source / template / workbook). The FILE CONTENTS inherit the source
 * entity's classification; this ledger row itself is public data. See
 * `blueprints/transfer/data-classes.json` for the tier assignment.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(XferArtifact::class)]
interface XferArtifactInterface
{
    public const string TABLE = 'xfer_artifacts';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'xart';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                   = 'id';
    public const string ATTR_TENANT_ID            = 'tenant_id';
    public const string ATTR_XFER_JOB_ID          = 'xfer_job_id';
    public const string ATTR_KIND                 = 'kind';
    public const string ATTR_FORMAT               = 'format';
    public const string ATTR_DISK                 = 'disk';
    public const string ATTR_PATH                 = 'path';
    public const string ATTR_FILENAME             = 'filename';
    public const string ATTR_MIME_TYPE            = 'mime_type';
    public const string ATTR_SIZE_BYTES           = 'size_bytes';
    public const string ATTR_ROW_COUNT            = 'row_count';
    public const string ATTR_CHECKSUM_SHA256      = 'checksum_sha256';
    public const string ATTR_RETENTION_EXPIRES_AT = 'retention_expires_at';
    public const string ATTR_PURGED_AT            = 'purged_at';
    public const string ATTR_CREATED_BY_TYPE      = 'created_by_type';
    public const string ATTR_CREATED_BY_ID        = 'created_by_id';
    public const string ATTR_CREATED_AT           = 'created_at';
    public const string ATTR_UPDATED_AT           = 'updated_at';
}
