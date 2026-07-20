<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Data;

use Academorix\Geography\Models\City;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `cities` table.
 *
 * City row. Vendor-owned schema. High-volume (~150k rows). Repository
 * refuses unscoped `index()` calls unless `?filter[country_id]=` or
 * `?filter[state_id]=` is present — the guard prevents full-table
 * scans on a table with no useful ordering.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(City::class)]
interface CityInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'cities';

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
    public const string ATTR_STATE_ID     = 'state_id';
    public const string ATTR_NAME         = 'name';
    public const string ATTR_COUNTRY_CODE = 'country_code';
    public const string ATTR_STATE_CODE   = 'state_code';
    public const string ATTR_LATITUDE     = 'latitude';
    public const string ATTR_LONGITUDE    = 'longitude';
}
