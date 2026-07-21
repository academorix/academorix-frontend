<?php

declare(strict_types=1);

namespace Stackra\Geography\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Geography\Contracts\Data\LanguageInterface;
use Stackra\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Stackra\Geography\Models\Language;

/**
 * Eloquent implementation of {@see LanguageRepositoryInterface}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(LanguageInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    LanguageInterface::ATTR_CODE       => ['$eq', '$in'],
    LanguageInterface::ATTR_COUNTRY_ID => ['$eq', '$in'],
    LanguageInterface::ATTR_NAME       => ['$eq', '$contains'],
    LanguageInterface::ATTR_DIR        => ['$eq'],
    LanguageInterface::ATTR_IS_RTL     => ['$eq'],
])]
final class EloquentLanguageRepository extends Repository implements LanguageRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByCode(string $code): ?Language
    {
        /** @var Language|null $row */
        $row = $this->query()
            ->where(LanguageInterface::ATTR_CODE, \strtolower($code))
            ->first();

        return $row;
    }
}
