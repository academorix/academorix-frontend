<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\Models\NotificationDelivery;
use Stackra\Notifications\Repositories\EloquentNotificationDeliveryRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NotificationDelivery}.
 *
 * Adds finders the reconciler + retry scheduler need on top of base CRUD.
 *
 * @extends RepositoryInterface<NotificationDelivery>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationDeliveryRepository::class)]
interface NotificationDeliveryRepositoryInterface extends RepositoryInterface
{
    /**
     * Every delivery attached to a notification (most recent attempt first).
     *
     * @return Collection<int, NotificationDelivery>
     */
    public function findByNotification(string $notificationId): Collection;

    /**
     * Every delivery whose `next_retry_at` is not null and lies before
     * `$cutoff` — the retry scheduler read path.
     *
     * @return Collection<int, NotificationDelivery>
     */
    public function findRetryableBefore(\DateTimeInterface $cutoff): Collection;

    /**
     * Every delivery on `$channel` whose state is `sent` and whose
     * `delivered_at` is still null and whose `attempted_at` is after
     * `$since` — the reconciler read path.
     *
     * @return Collection<int, NotificationDelivery>
     */
    public function findAwaitingConfirmation(string $channel, \DateTimeInterface $since): Collection;
}
