<?php

declare(strict_types=1);

namespace Academorix\Webhook\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Academorix\Webhook\Enums\WebhookDeliveryStatus;
use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see WebhookDeliveryRepositoryInterface}.
 *
 * NOT cached — deliveries are append-only rows read for dashboards +
 * retry scheduling; the query volume is bounded by pagination.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(WebhookDeliveryInterface::class)]
#[Filterable([
    WebhookDeliveryInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID => ['$eq', '$in'],
    WebhookDeliveryInterface::ATTR_EVENT_NAME      => ['$eq', '$in'],
    WebhookDeliveryInterface::ATTR_STATUS          => ['$eq', '$in'],
    WebhookDeliveryInterface::ATTR_EVENT_ID        => ['$eq'],
])]
final class EloquentWebhookDeliveryRepository extends Repository implements WebhookDeliveryRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySubscription(string $subscriptionId): Collection
    {
        /** @var Collection<int, WebhookDelivery> $rows */
        $rows = $this->query()
            ->where(WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID, $subscriptionId)
            ->orderByDesc(WebhookDeliveryInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findRetryableBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, WebhookDelivery> $rows */
        $rows = $this->query()
            ->where(WebhookDeliveryInterface::ATTR_STATUS, WebhookDeliveryStatus::Failed->value)
            ->whereNotNull(WebhookDeliveryInterface::ATTR_RETRY_AT)
            ->where(WebhookDeliveryInterface::ATTR_RETRY_AT, '<=', $cutoff)
            ->orderBy(WebhookDeliveryInterface::ATTR_RETRY_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneOlderThan(\DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(WebhookDeliveryInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }
}
