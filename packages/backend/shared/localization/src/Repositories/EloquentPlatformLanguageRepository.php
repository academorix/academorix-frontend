<?php

declare(strict_types=1);

namespace Academorix\Localization\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Models\PlatformLanguage;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see PlatformLanguageRepositoryInterface}.
 *
 * ## What this class owns
 *
 * Catalogue-scoped finders on top of the base CRUD surface:
 *
 *   - {@see findByBcp47()}        — BCP-47 canonical lookup.
 *   - {@see findAllActive()}       — active + non-beta catalogue.
 *   - {@see findAllKeyedByCode()} — hash used by Accept-Language matching.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(PlatformLanguageInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    PlatformLanguageInterface::ATTR_BCP47_CODE         => ['$eq', '$in', '$contains'],
    PlatformLanguageInterface::ATTR_SCRIPT             => ['$eq', '$in'],
    PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE => ['$eq'],
    PlatformLanguageInterface::ATTR_IS_BETA            => ['$eq'],
    PlatformLanguageInterface::ATTR_IS_SYSTEM          => ['$eq'],
])]
final class EloquentPlatformLanguageRepository extends Repository implements PlatformLanguageRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByBcp47(string $bcp47Code): ?PlatformLanguage
    {
        /** @var PlatformLanguage|null $row */
        $row = $this->query()
            ->where(PlatformLanguageInterface::ATTR_BCP47_CODE, $bcp47Code)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllActive(): Collection
    {
        /** @var Collection<int, PlatformLanguage> $rows */
        $rows = $this->query()
            ->where(PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE, true)
            ->where(PlatformLanguageInterface::ATTR_IS_BETA, false)
            ->orderBy(PlatformLanguageInterface::ATTR_SORT_ORDER)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllKeyedByCode(): Collection
    {
        return $this->findAllActive()->keyBy(
            static fn (PlatformLanguage $row): string => (string) $row->{PlatformLanguageInterface::ATTR_BCP47_CODE},
        );
    }
}
