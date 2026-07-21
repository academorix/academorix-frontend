<?php

declare(strict_types=1);

namespace Stackra\Notifications\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Contracts\Data\NotificationCategoryInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationCategoryRepositoryInterface;
use Stackra\Notifications\Models\NotificationCategory;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see NotificationCategoryRepositoryInterface}.
 *
 * `#[Cacheable(ttl: 3600)]` — categories are configuration, not
 * high-mutation data. A one-hour TTL keeps registry reads cheap.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationCategoryInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    NotificationCategoryInterface::ATTR_TENANT_ID       => ['$eq', '$null'],
    NotificationCategoryInterface::ATTR_SLUG            => ['$eq', '$in', '$contains'],
    NotificationCategoryInterface::ATTR_OWNING_MODULE   => ['$eq', '$in'],
    NotificationCategoryInterface::ATTR_PRIORITY        => ['$eq', '$in'],
    NotificationCategoryInterface::ATTR_CONSENT_TIER    => ['$eq', '$in'],
    NotificationCategoryInterface::ATTR_IS_SYSTEM       => ['$eq'],
    NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED => ['$eq'],
])]
final class EloquentNotificationCategoryRepository extends Repository implements NotificationCategoryRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForTenant(?string $tenantId): Collection
    {
        /** @var Collection<int, NotificationCategory> $rows */
        $rows = $this->query()
            ->where(function ($query) use ($tenantId): void {
                $query->whereNull(NotificationCategoryInterface::ATTR_TENANT_ID);
                if ($tenantId !== null) {
                    $query->orWhere(NotificationCategoryInterface::ATTR_TENANT_ID, $tenantId);
                }
            })
            ->orderBy(NotificationCategoryInterface::ATTR_OWNING_MODULE)
            ->orderBy(NotificationCategoryInterface::ATTR_SLUG)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function resolveBySlug(?string $tenantId, string $slug): ?NotificationCategory
    {
        // Tenant override first — most specific wins.
        if ($tenantId !== null) {
            /** @var NotificationCategory|null $override */
            $override = $this->query()
                ->where(NotificationCategoryInterface::ATTR_TENANT_ID, $tenantId)
                ->where(NotificationCategoryInterface::ATTR_SLUG, $slug)
                ->first();

            if ($override !== null) {
                return $override;
            }
        }

        /** @var NotificationCategory|null $platform */
        $platform = $this->query()
            ->whereNull(NotificationCategoryInterface::ATTR_TENANT_ID)
            ->where(NotificationCategoryInterface::ATTR_SLUG, $slug)
            ->first();

        return $platform;
    }
}
