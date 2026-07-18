<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Data;

use Academorix\Localization\Models\TranslationJob;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `translation_jobs` table.
 *
 * Audit trail for async bulk-translation work. Append-only in
 * practice — `status` transitions capture progress, and finished
 * rows are retained per `config('localization.retention.job_retention_days')`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(TranslationJob::class)]
interface TranslationJobInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'translation_jobs';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `tjb_<ulid>`.
     */
    public const string ID_PREFIX = 'tjb';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_INITIATOR_ID      = 'initiator_id';
    public const string ATTR_KIND              = 'kind';
    public const string ATTR_DRIVER            = 'driver';
    public const string ATTR_DRIVER_MODEL      = 'driver_model';
    public const string ATTR_SOURCE_LOCALE     = 'source_locale';
    public const string ATTR_TARGET_LOCALE     = 'target_locale';
    public const string ATTR_STATUS            = 'status';
    public const string ATTR_TOTAL_KEYS        = 'total_keys';
    public const string ATTR_TRANSLATED_KEYS   = 'translated_keys';
    public const string ATTR_FAILED_KEYS       = 'failed_keys';
    public const string ATTR_NAMESPACE_FILTER  = 'namespace_filter';
    public const string ATTR_GROUP_FILTER      = 'group_filter';
    public const string ATTR_STARTED_AT        = 'started_at';
    public const string ATTR_FINISHED_AT       = 'finished_at';
    public const string ATTR_ERROR_MESSAGE     = 'error_message';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
}
