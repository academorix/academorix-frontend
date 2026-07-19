<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Data;

use Academorix\Geography\Models\Language;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `languages` table.
 *
 * ISO-639 language reference row. Vendor-owned schema. Single source
 * of truth for language display metadata across the platform. Since
 * Wave 5, `localization::PlatformLanguage` references (does not
 * duplicate) this table via `platform_languages.geography_language_id`.
 * Route binding accepts numeric PK OR ISO-639-1 code (lowercase).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(Language::class)]
interface LanguageInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'languages';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — integer auto-increment (vendor default).
     */
    public const string KEY_TYPE = 'int';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID         = 'id';
    public const string ATTR_COUNTRY_ID = 'country_id';
    public const string ATTR_CODE       = 'code';
    public const string ATTR_NAME       = 'name';
    public const string ATTR_NATIVE     = 'native';
    public const string ATTR_DIR        = 'dir';
    public const string ATTR_IS_RTL     = 'is_rtl';
}
