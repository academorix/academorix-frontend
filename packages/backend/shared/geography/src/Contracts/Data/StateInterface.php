<?php

declare(strict_types=1);

namespace Stackra\Geography\Contracts\Data;

use Stackra\Geography\Models\State;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `states` table.
 *
 * ISO-3166-2 state / province / region row. Vendor-owned schema.
 * Nested under Country in the REST surface. Repository refuses
 * unscoped `index()` calls without `?filter[country_id]=` to prevent
 * full-table scans across ~5000 rows.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(State::class)]
interface StateInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'states';

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
    public const string ATTR_STATE_CODE   = 'state_code';
    public const string ATTR_TYPE         = 'type';
    public const string ATTR_LATITUDE     = 'latitude';
    public const string ATTR_LONGITUDE    = 'longitude';
}
