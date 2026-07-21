<?php

declare(strict_types=1);

namespace Stackra\Geography\Contracts\Data;

use Stackra\Geography\Models\Timezone;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `timezones` table.
 *
 * IANA timezone row. Vendor-owned schema. Route binding accepts
 * numeric PK OR the URL-encoded IANA name (e.g. `Europe%2FParis`).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(Timezone::class)]
interface TimezoneInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'timezones';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — integer auto-increment (vendor default).
     */
    public const string KEY_TYPE = 'int';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID           = 'id';
    public const string ATTR_COUNTRY_ID   = 'country_id';
    public const string ATTR_NAME         = 'name';
    public const string ATTR_COUNTRY_CODE = 'country_code';
}
