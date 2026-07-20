<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Data;

use Academorix\Compliance\Models\DsarArtefact;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `dsar_artefacts` table.
 *
 * One row per contributing module per DSAR. `file_id` references the
 * storage::File that holds the assembled data; null before assembly
 * lands.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DsarArtefact::class)]
interface DsarArtefactInterface
{
    public const string TABLE = 'dsar_artefacts';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'dsa';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_DSAR_ID           = 'dsar_id';
    public const string ATTR_MODULE            = 'module';
    public const string ATTR_ENTITY            = 'entity';
    public const string ATTR_ROW_COUNT         = 'row_count';
    public const string ATTR_FORMAT            = 'format';
    public const string ATTR_FILE_ID           = 'file_id';
    public const string ATTR_REDACTED_COLUMNS  = 'redacted_columns';
    public const string ATTR_STATUS            = 'status';
    public const string ATTR_ERROR             = 'error';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_DELETED_BY        = 'deleted_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
    public const string ATTR_DELETED_AT        = 'deleted_at';
}
