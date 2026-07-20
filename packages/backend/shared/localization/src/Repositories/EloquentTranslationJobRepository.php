<?php

declare(strict_types=1);

namespace Academorix\Localization\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Models\TranslationJob;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TranslationJobRepositoryInterface}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TranslationJobInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    TranslationJobInterface::ATTR_TENANT_ID    => ['$eq'],
    TranslationJobInterface::ATTR_STATUS       => ['$eq', '$in'],
    TranslationJobInterface::ATTR_DRIVER       => ['$eq', '$in'],
    TranslationJobInterface::ATTR_KIND         => ['$eq'],
    TranslationJobInterface::ATTR_TARGET_LOCALE => ['$eq', '$in'],
    TranslationJobInterface::ATTR_CREATED_AT   => ['$gte', '$lte', '$between'],
])]
final class EloquentTranslationJobRepository extends Repository implements TranslationJobRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActiveForTenant(string $tenantId): Collection
    {
        /** @var Collection<int, TranslationJob> $rows */
        $rows = $this->query()
            ->where(TranslationJobInterface::ATTR_TENANT_ID, $tenantId)
            ->whereIn(TranslationJobInterface::ATTR_STATUS, [
                TranslationJobStatus::Queued->value,
                TranslationJobStatus::Running->value,
            ])
            ->orderByDesc(TranslationJobInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function incrementTranslatedKeys(string $jobId): void
    {
        $this->query()
            ->whereKey($jobId)
            ->increment(TranslationJobInterface::ATTR_TRANSLATED_KEYS);
    }

    /**
     * {@inheritDoc}
     */
    public function incrementFailedKeys(string $jobId): void
    {
        $this->query()
            ->whereKey($jobId)
            ->increment(TranslationJobInterface::ATTR_FAILED_KEYS);
    }
}
