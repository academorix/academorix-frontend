<?php

declare(strict_types=1);

namespace Academorix\Geography\Models;

use Academorix\Geography\Concerns\HasWorldLocalizedName;
use Academorix\Geography\Contracts\Data\CountryInterface;
use Academorix\Geography\Database\Factories\CountryFactory;
use Academorix\Geography\Observers\CountryObserver;
use Academorix\Geography\Policies\CountryPolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\Country as WorldCountry;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see CountryInterface}.
 *
 * SUBCLASSES the vendor `Nnjeim\World\Models\Country` and rebinds
 * `config('world.models.country')` in `GeographyServiceProvider` so
 * vendor relations return our subclass. Vendor uses integer PKs +
 * `$timestamps = false` — we do NOT override either.
 *
 * NOT `final` — vendor's `Country` isn't final and consumers may
 * legitimately extend further with app-specific accessors.
 *
 * Route binding accepts BOTH the numeric PK AND ISO-3166 alpha-2
 * (case-insensitive), so `/countries/76` and `/countries/FR` both
 * resolve to the same row. See {@see resolveRouteBinding()}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(CountryFactory::class)]
#[UsePolicy(CountryPolicy::class)]
#[ObservedBy([CountryObserver::class])]
class Country extends WorldCountry implements AuditableContract, CountryInterface
{
    use Auditable;
    use HasFactory;
    use HasWorldLocalizedName;

    /**
     * Wire representation appends the computed localized name so
     * `$country->localized_name` is present on every serialised row.
     *
     * @var list<string>
     */
    protected $appends = ['localized_name'];

    /**
     * Cast map — `status` is an integer flag on the vendor schema.
     *
     * @var array<string, string>
     */
    protected $casts = [
        CountryInterface::ATTR_STATUS => 'integer',
    ];

    /**
     * Route-model-binding resolver.
     *
     * Accepts EITHER the numeric primary key OR the ISO-3166 alpha-2
     * code (case-insensitive). A pure-numeric string matches on `id`;
     * anything else uppercases + matches on `iso2`.
     *
     * @param  mixed        $value  URL segment.
     * @param  string|null  $field  Optional explicit binding field.
     * @return $this|null
     */
    public function resolveRouteBinding($value, $field = null): ?self
    {
        // Explicit binding field wins — respects `->scopeBindings()`
        // and the framework's `#[WhereUuid]` / `#[WhereUlid]` chain.
        if ($field !== null) {
            /** @var self|null $model */
            $model = static::query()->where($field, $value)->first();

            return $model;
        }

        // Numeric string → primary key lookup.
        if (\is_numeric($value)) {
            /** @var self|null $model */
            $model = static::query()
                ->where(CountryInterface::ATTR_ID, (int) $value)
                ->first();

            return $model;
        }

        // Otherwise treat as ISO-3166 alpha-2 (case-insensitive).
        /** @var self|null $model */
        $model = static::query()
            ->where(CountryInterface::ATTR_ISO2, \strtoupper((string) $value))
            ->first();

        return $model;
    }
}
