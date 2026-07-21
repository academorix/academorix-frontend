<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Data;

use Stackra\Localization\Models\TenantLocale;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `tenant_locales` table.
 *
 * Per-tenant enablement of a {@see PlatformLanguageInterface}. Owns
 * `is_default` (exactly one per tenant), `is_fallback` (at most one
 * per tenant), `is_active`, and the optional auto-translate driver
 * override.
 *
 * Composite unique `(tenant_id, language_id)` — a tenant cannot
 * enable the same platform language twice.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(TenantLocale::class)]
interface TenantLocaleInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'tenant_locales';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `tll_<ulid>`.
     */
    public const string ID_PREFIX = 'tll';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_LANGUAGE_ID           = 'language_id';
    public const string ATTR_IS_DEFAULT            = 'is_default';
    public const string ATTR_IS_FALLBACK           = 'is_fallback';
    public const string ATTR_IS_ACTIVE             = 'is_active';
    public const string ATTR_AUTO_TRANSLATE_DRIVER = 'auto_translate_driver';
    public const string ATTR_MIN_QUALITY_SCORE     = 'min_quality_score';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
