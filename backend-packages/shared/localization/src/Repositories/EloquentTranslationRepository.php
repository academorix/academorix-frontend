<?php

declare(strict_types=1);

namespace Academorix\Localization\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Academorix\Localization\Models\Translation;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TranslationRepositoryInterface}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TranslationInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    TranslationInterface::ATTR_TENANT_ID    => ['$eq', '$in', '$null'],
    TranslationInterface::ATTR_LANGUAGE_ID  => ['$eq', '$in'],
    TranslationInterface::ATTR_NAMESPACE    => ['$eq', '$in'],
    TranslationInterface::ATTR_GROUP        => ['$eq', '$in'],
    TranslationInterface::ATTR_KEY          => ['$eq', '$contains'],
    TranslationInterface::ATTR_LOCALE_CODE  => ['$eq', '$in'],
    TranslationInterface::ATTR_SOURCE       => ['$eq', '$in'],
    TranslationInterface::ATTR_IS_VERIFIED  => ['$eq'],
    TranslationInterface::ATTR_IS_STALE     => ['$eq'],
    TranslationInterface::ATTR_CREATED_AT   => ['$gte', '$lte', '$between'],
])]
final class EloquentTranslationRepository extends Repository implements TranslationRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findResolved(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
    ): ?Translation {
        $query = $this->query()
            ->where(TranslationInterface::ATTR_LOCALE_CODE, $localeCode)
            ->where(TranslationInterface::ATTR_NAMESPACE, $namespace)
            ->where(TranslationInterface::ATTR_GROUP, $group)
            ->where(TranslationInterface::ATTR_KEY, $key);

        if ($tenantId !== null) {
            // Tenant override wins over platform default.
            $query->where(TranslationInterface::ATTR_TENANT_ID, $tenantId);
        } else {
            $query->whereNull(TranslationInterface::ATTR_TENANT_ID);
        }

        /** @var Translation|null $row */
        $row = $query->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findGroup(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
    ): Collection {
        $query = $this->query()
            ->where(TranslationInterface::ATTR_LOCALE_CODE, $localeCode)
            ->where(TranslationInterface::ATTR_NAMESPACE, $namespace)
            ->where(TranslationInterface::ATTR_GROUP, $group);

        if ($tenantId !== null) {
            $query->where(TranslationInterface::ATTR_TENANT_ID, $tenantId);
        } else {
            $query->whereNull(TranslationInterface::ATTR_TENANT_ID);
        }

        /** @var Collection<int, Translation> $rows */
        $rows = $query->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneStaleOlderThan(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(TranslationInterface::ATTR_IS_STALE, true)
            ->where(TranslationInterface::ATTR_UPDATED_AT, '<', $cutoff)
            ->delete();
    }
}
