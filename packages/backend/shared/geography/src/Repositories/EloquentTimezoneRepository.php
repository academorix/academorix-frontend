<?php

declare(strict_types=1);

namespace Stackra\Geography\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Geography\Contracts\Data\TimezoneInterface;
use Stackra\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Stackra\Geography\Models\Timezone;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TimezoneRepositoryInterface}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TimezoneInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    TimezoneInterface::ATTR_COUNTRY_ID   => ['$eq', '$in'],
    TimezoneInterface::ATTR_COUNTRY_CODE => ['$eq', '$in'],
    TimezoneInterface::ATTR_NAME         => ['$eq', '$contains'],
])]
final class EloquentTimezoneRepository extends Repository implements TimezoneRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByCountry(int $countryId): Collection
    {
        /** @var Collection<int, Timezone> $rows */
        $rows = $this->query()
            ->where(TimezoneInterface::ATTR_COUNTRY_ID, $countryId)
            ->orderBy(TimezoneInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByName(string $name): ?Timezone
    {
        /** @var Timezone|null $row */
        $row = $this->query()
            ->where(TimezoneInterface::ATTR_NAME, $name)
            ->first();

        return $row;
    }
}
