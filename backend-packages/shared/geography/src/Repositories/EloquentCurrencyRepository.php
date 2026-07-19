<?php

declare(strict_types=1);

namespace Academorix\Geography\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Geography\Contracts\Data\CurrencyInterface;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Models\Currency;

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
