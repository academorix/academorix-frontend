<?php

declare(strict_types=1);

namespace Stackra\Webhook\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Enums\WebhookDeliveryStatus;
use Stackra\Webhook\Models\WebhookDelivery;
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
