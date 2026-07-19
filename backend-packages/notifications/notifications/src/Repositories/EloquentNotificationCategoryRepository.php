<?php

declare(strict_types=1);

namespace Academorix\Notifications\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Notifications\Contracts\Data\NotificationCategoryInterface;
use Academorix\Notifications\Contracts\Repositories\NotificationCategoryRepositoryInterface;
use Academorix\Notifications\Models\NotificationCategory;
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
