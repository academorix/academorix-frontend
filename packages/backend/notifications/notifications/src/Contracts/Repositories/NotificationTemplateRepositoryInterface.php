<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Notifications\Repositories\EloquentNotificationTemplateRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NotificationTemplate}.
 *
 * Adds the resolver read paths on top of base CRUD. The dispatch
 * pipeline resolves `(key, channel, locale)` deepest-wins: tenant
 * override > platform default > platform default English fallback.
 *
 * @extends RepositoryInterface<NotificationTemplate>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationTemplateRepository::class)]
interface NotificationTemplateRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve the deepest-matching published template for the tuple.
     *
     * Lookup order:
     *   1. Tenant override with same key + channel + locale.
     *   2. Platform default with same key + channel + locale.
     *   3. Platform default with same key + channel + `en` locale.
     */
    public function resolvePublished(
        ?string $tenantId,
        string $key,
        string $channel,
        string $locale,
    ): ?NotificationTemplate;

    /**
     * Every template row (all versions) for the tuple. Used by admin surfaces.
     *
     * @return Collection<int, NotificationTemplate>
     */
    public function findAllVersions(?string $tenantId, string $key, string $channel, string $locale): Collection;
}
