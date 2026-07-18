<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Subscription\Models\SubscriptionEvent;
use Academorix\Subscription\Repositories\EloquentSubscriptionEventRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SubscriptionEvent}.
 *
 * Adds the domain finders needed by the audit surface + Cashier
 * webhook consumer's idempotency check on top of the base CRUD
 * surface.
 *
 * @extends RepositoryInterface<SubscriptionEvent>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(EloquentSubscriptionEventRepository::class)]
interface SubscriptionEventRepositoryInterface extends RepositoryInterface
{
    /**
     * Every event for one subscription, newest first.
     *
     * @return Collection<int, SubscriptionEvent>
     */
    public function findBySubscription(string $subscriptionId): Collection;

    /**
     * Look up an event by its provider event id — the idempotency
     * key used by the Cashier webhook consumer. Returns null when
     * the provider event has never been processed.
     */
    public function findByProviderEventId(string $providerEventId): ?SubscriptionEvent;

    /**
     * Every event for one tenant, newest first. Powers the
     * tenant-facing SOX audit feed.
     *
     * @return Collection<int, SubscriptionEvent>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;
}
