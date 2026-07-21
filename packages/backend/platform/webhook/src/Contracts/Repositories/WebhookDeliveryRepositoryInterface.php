<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Repositories\EloquentWebhookDeliveryRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see WebhookDelivery}.
 *
 * Adds finders the retry scheduler + retention job need on top of the
 * base CRUD surface.
 *
 * @extends RepositoryInterface<WebhookDelivery>
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(EloquentWebhookDeliveryRepository::class)]
interface WebhookDeliveryRepositoryInterface extends RepositoryInterface
{
    /**
     * Every delivery attached to a subscription (most recent first).
     *
     * @return Collection<int, WebhookDelivery>
     */
    public function findBySubscription(string $subscriptionId): Collection;

    /**
     * Every delivery whose `retry_at` is not null and lies before
     * `$cutoff` — the retry scheduler's read path.
     *
     * @return Collection<int, WebhookDelivery>
     */
    public function findRetryableBefore(\DateTimeInterface $cutoff): Collection;

    /**
     * Hard-delete every delivery row created before `$cutoff`.
     *
     * @return int  Number of rows deleted.
     */
    public function pruneOlderThan(\DateTimeInterface $cutoff): int;
}
