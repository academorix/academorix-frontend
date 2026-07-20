<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\Country;
use Academorix\Geography\Repositories\EloquentCountryRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Country}.
 *
 * Adds catalog-specific finders on top of the base CRUD surface.
 * Consumers type-hint the interface, not the concrete
 * `EloquentCountryRepository`, so the container can swap in a stub
 * for tests.
 *
 * @extends RepositoryInterface<Country>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentCountryRepository::class)]
interface CountryRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a country by ISO-3166 alpha-2 (case-insensitive).
     *
     * @param  string  $iso2  Two-letter ISO code (e.g. `FR`).
     * @return Country|null
     */
    public function findByIso2(string $iso2): ?Country;

    /**
     * Find a country by ISO-3166 alpha-3 (case-insensitive).
     *
     * @param  string  $iso3  Three-letter ISO code (e.g. `FRA`).
     * @return Country|null
     */
    public function findByIso3(string $iso3): ?Country;

    /**
     * List countries filtered by UN M49 region (e.g. `Europe`).
     *
     * @param  string  $region  Case-sensitive region name.
     * @return Collection<int, Country>
     */
    public function findByRegion(string $region): Collection;
}
