<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Data;

use Academorix\Geography\Models\Country;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `countries` table.
 *
 * ISO-3166 country row. Vendor `nnjeim/world` owns the migration +
 * seeder for this table (this module ships NO migration for it).
 * Our model subclasses the vendor's, rebound via
 * `config('world.models.country')` in `GeographyServiceProvider`.
 *
 * Route binding accepts BOTH numeric id AND ISO-3166 alpha-2
 * (case-insensitive) so `/countries/76` and `/countries/FR` both
 * resolve to the same row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(Country::class)]
interface CountryInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'countries';

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
    public const string ATTR_ISO2       = 'iso2';
    public const string ATTR_ISO3       = 'iso3';
    public const string ATTR_NAME       = 'name';
    public const string ATTR_NATIVE     = 'native';
    public const string ATTR_PHONE_CODE = 'phone_code';
    public const string ATTR_REGION     = 'region';
    public const string ATTR_SUBREGION  = 'subregion';
    public const string ATTR_LATITUDE   = 'latitude';
    public const string ATTR_LONGITUDE  = 'longitude';
    public const string ATTR_EMOJI      = 'emoji';
    public const string ATTR_EMOJI_U    = 'emojiU';
    public const string ATTR_STATUS     = 'status';
}
