<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Data;

use Academorix\Localization\Models\Translation;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `translations` table.
 *
 * The persistent DB cache the decorated Translator consults before
 * the filesystem. Rows are keyed by
 * `(tenant_id, language_id, namespace, group, key)` — `tenant_id`
 * NULL means "platform default"; non-null means "tenant override".
 *
 * Composite unique — see the migration for the two partial-unique
 * indexes (one with `tenant_id IS NULL`, one with `tenant_id IS NOT NULL`).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(Translation::class)]
interface TranslationInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'translations';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `trn_<ulid>`.
     */
    public const string ID_PREFIX = 'trn';

    /**
     * The default namespace applied when a caller doesn't specify one.
     * Mirrors Laravel's convention where "no namespace" collapses to
     * the sentinel `*`.
     */
    public const string NAMESPACE_DEFAULT = '*';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_TENANT_ID           = 'tenant_id';
    public const string ATTR_LANGUAGE_ID         = 'language_id';
    public const string ATTR_TRANSLATION_JOB_ID  = 'translation_job_id';
    public const string ATTR_NAMESPACE           = 'namespace';
    public const string ATTR_GROUP               = 'group';
    public const string ATTR_KEY                 = 'key';
    public const string ATTR_LOCALE_CODE         = 'locale_code';
    public const string ATTR_VALUE               = 'value';
    public const string ATTR_SOURCE              = 'source';
    public const string ATTR_PROVIDER            = 'provider';
    public const string ATTR_QUALITY_SCORE       = 'quality_score';
    public const string ATTR_SOURCE_HASH         = 'source_hash';
    public const string ATTR_IS_VERIFIED         = 'is_verified';
    public const string ATTR_IS_STALE            = 'is_stale';
    public const string ATTR_VERIFIED_BY         = 'verified_by';
    public const string ATTR_VERIFIED_AT         = 'verified_at';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_DELETED_BY          = 'deleted_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
    public const string ATTR_DELETED_AT          = 'deleted_at';
}
