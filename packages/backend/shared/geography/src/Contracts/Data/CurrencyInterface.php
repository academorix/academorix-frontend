<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Data;

use Academorix\Geography\Models\Currency;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `currencies` table.
 *
 * ISO-4217 currency row. Vendor-owned schema. Route binding accepts
 * numeric PK OR ISO-4217 code (case-insensitive). `precision` +
 * `symbol` fields drive money formatting across the app.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(Currency::class)]
interface CurrencyInterface
{
    /**
     * Table name — vendor-owned.
     */
    public const string TABLE = 'currencies';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — integer auto-increment (vendor default).
     */
    public const string KEY_TYPE = 'int';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID            = 'id';
    public const string ATTR_COUNTRY_ID    = 'country_id';
    public const string ATTR_NAME          = 'name';
    public const string ATTR_CODE          = 'code';
    public const string ATTR_SYMBOL        = 'symbol';
    public const string ATTR_SYMBOL_NATIVE = 'symbol_native';
    public const string ATTR_PRECISION     = 'precision';
}
