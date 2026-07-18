<?php

declare(strict_types=1);

namespace Academorix\Geography\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Geography\Contracts\Data\LanguageInterface;
use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Academorix\Geography\Models\Language;

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
