<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\Timezone;
use Academorix\Geography\Repositories\EloquentTimezoneRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Timezone}.
 *
 * @extends RepositoryInterface<Timezone>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentTimezoneRepository::class)]
interface TimezoneRepositoryInterface extends RepositoryInterface
{
    /**
     * Every timezone within a country.
     *
     * @param  int  $countryId  Country primary key.
     * @return Collection<int, Timezone>
     */
    public function findByCountry(int $countryId): Collection;

    /**
     * Find a timezone by its IANA name (e.g. `Europe/Paris`).
     *
     * @param  string  $name  IANA name — case-sensitive.
     * @return Timezone|null
     */
    public function findByName(string $name): ?Timezone;
}
