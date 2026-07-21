<?php

declare(strict_types=1);

namespace Stackra\Geography\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Geography\Contracts\Data\CurrencyInterface;
use Stackra\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Stackra\Geography\Models\Currency;

/**
 * Eloquent implementation of {@see CurrencyRepositoryInterface}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(CurrencyInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    CurrencyInterface::ATTR_CODE       => ['$eq', '$in'],
    CurrencyInterface::ATTR_COUNTRY_ID => ['$eq', '$in'],
    CurrencyInterface::ATTR_NAME       => ['$eq', '$contains'],
    CurrencyInterface::ATTR_PRECISION  => ['$eq', '$in'],
])]
final class EloquentCurrencyRepository extends Repository implements CurrencyRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByCode(string $code): ?Currency
    {
        /** @var Currency|null $row */
        $row = $this->query()
            ->where(CurrencyInterface::ATTR_CODE, \strtoupper($code))
            ->first();

        return $row;
    }
}
