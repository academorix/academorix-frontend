<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Models\NotificationDigest;
use Stackra\Notifications\Services\DefaultDigestScheduler;
use Illuminate\Container\Attributes\Bind;

/**
 * Batches notifications into digest buckets.
 *
 * When the preference resolver returns a decision with a non-immediate
 * digest mode, the dispatch gateway hands the notification off to this
 * scheduler which appends it to the current digest bucket for that
 * `(user, category, channel, window)` tuple.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(DefaultDigestScheduler::class)]
interface DigestSchedulerInterface
{
    /**
     * Attach a notification to its digest bucket.
     *
     * @param  Notification  $notification  The notification to defer.
     * @param  string        $digestMode    Digest mode identifier (daily / weekly).
     * @param  string        $channel       Channel key.
     */
    public function attach(Notification $notification, string $digestMode, string $channel): NotificationDigest;

    /**
     * Every pending digest whose window boundary has elapsed.
     *
     * @return array<int, NotificationDigest>
     */
    public function findDue(\DateTimeInterface $now): array;

    /**
     * Compute the `scheduled_for` boundary for the tuple.
     *
     * @param  string  $digestMode        Digest mode identifier.
     * @param  string  $userTimezone      IANA timezone identifier.
     */
    public function computeBoundary(string $digestMode, string $userTimezone, \DateTimeInterface $now): \DateTimeInterface;
}
