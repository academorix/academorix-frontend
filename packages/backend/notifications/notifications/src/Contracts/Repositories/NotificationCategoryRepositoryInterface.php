<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\Models\NotificationCategory;
use Stackra\Notifications\Repositories\EloquentNotificationCategoryRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NotificationCategory}.
 *
 * Adds the resolver read paths on top of base CRUD. The category
 * registry seeds itself from every module's `notifications.json`
 * blueprint via `notifications:seed-categories` and hydrates from
 * this table at boot.
 *
 * @extends RepositoryInterface<NotificationCategory>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationCategoryRepository::class)]
interface NotificationCategoryRepositoryInterface extends RepositoryInterface
{
    /**
     * Every category applicable to a tenant — the platform defaults
     * merged with the tenant's overrides (tenant overrides win by slug).
     *
     * @return Collection<int, NotificationCategory>
     */
    public function findForTenant(?string $tenantId): Collection;

    /**
     * The effective category row for `(tenantId, slug)` — tenant
     * override if present, otherwise the platform default.
     */
    public function resolveBySlug(?string $tenantId, string $slug): ?NotificationCategory;
}
