<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Data;

use Stackra\Localization\Models\PlatformLanguage;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `platform_languages` table.
 *
 * Platform-plane catalogue of BCP-47 locale tags. Owns only the
 * platform-scoped concerns — the ISO-639-1 base metadata (code, name,
 * native name, direction) FK-references `geography::Language`, and
 * the country-region flag emoji FK-references `geography::Country`
 * (nullable, only populated for regional variants like `fr-CA`).
 *
 * The table name deliberately avoids the plain `languages` collision
 * with the vendor-owned `languages` table shipped by `nnjeim/world`
 * (geography module).
 *
 * NOT tenant-scoped — the catalogue is shared across every tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(PlatformLanguage::class)]
interface PlatformLanguageInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'platform_languages';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `lng_<ulid>`.
     */
    public const string ID_PREFIX = 'lng';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_BCP47_CODE            = 'bcp47_code';
    public const string ATTR_GEOGRAPHY_LANGUAGE_ID = 'geography_language_id';
    public const string ATTR_GEOGRAPHY_COUNTRY_ID  = 'geography_country_id';
    public const string ATTR_SCRIPT                = 'script';
    public const string ATTR_IS_PLATFORM_ACTIVE    = 'is_platform_active';
    public const string ATTR_IS_BETA               = 'is_beta';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_SORT_ORDER            = 'sort_order';
    public const string ATTR_NOTES                 = 'notes';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
