<?php

declare(strict_types=1);

namespace Academorix\Webhook\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Enums\WebhookSubscriptionStatus;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see WebhookSubscriptionRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60, tags: true)]` — a short TTL because
 * subscription state can flip (auto-disable) in response to events;
 * the observer flushes tenant tags on writes so the dispatcher sees
 * the new state immediately.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(WebhookSubscriptionInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    WebhookSubscriptionInterface::ATTR_TENANT_ID   => ['$eq', '$in'],
    WebhookSubscriptionInterface::ATTR_STATUS      => ['$eq', '$in'],
    WebhookSubscriptionInterface::ATTR_DESTINATION => ['$eq', '$in'],
])]
final class EloquentWebhookSubscriptionRepository extends Repository implements WebhookSubscriptionRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, WebhookSubscription> $rows */
        $rows = $this->query()
            ->where(WebhookSubscriptionInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(WebhookSubscriptionInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * A subscription matches the event when its `events` JSON array
     * contains the exact event name. Uses a `LIKE` clause for cross-
     * database portability (Postgres GIN + SQLite JSON contains).
     */
    public function findActiveForEvent(string $eventName): Collection
    {
        $needle = \sprintf('"%s"', $eventName);

        /** @var Collection<int, WebhookSubscription> $rows */
        $rows = $this->query()
            ->where(
                WebhookSubscriptionInterface::ATTR_STATUS,
                WebhookSubscriptionStatus::Active->value,
            )
            ->where(WebhookSubscriptionInterface::ATTR_EVENTS, 'like', '%' . $needle . '%')
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findDueForHealthProbe(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, WebhookSubscription> $rows */
        $rows = $this->query()
            ->where(
                WebhookSubscriptionInterface::ATTR_STATUS,
                WebhookSubscriptionStatus::Active->value,
            )
            ->whereNotNull(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_URL)
            ->where(function ($query) use ($cutoff): void {
                $query
                    ->whereNull(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT)
                    ->orWhere(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT, '<', $cutoff);
            })
            ->get();

        return $rows;
    }
}
