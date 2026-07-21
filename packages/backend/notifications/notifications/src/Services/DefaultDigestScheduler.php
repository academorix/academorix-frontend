<?php

declare(strict_types=1);

namespace Stackra\Notifications\Services;

use Stackra\Notifications\Contracts\Data\NotificationDigestInterface;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationDigestRepositoryInterface;
use Stackra\Notifications\Contracts\Services\DigestSchedulerInterface;
use Stackra\Notifications\Enums\DigestMode;
use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Models\NotificationDigest;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default digest scheduler.
 *
 * Computes the next boundary for `(digestMode, timezone)` and either
 * attaches to an existing pending digest OR opens a new one via
 * `NotificationDigestRepository::findOrCreateBucket()`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultDigestScheduler implements DigestSchedulerInterface
{
    /**
     * @param  NotificationDigestRepositoryInterface  $digests  Persistence boundary.
     */
    public function __construct(
        private readonly NotificationDigestRepositoryInterface $digests,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function attach(Notification $notification, string $digestMode, string $channel): NotificationDigest
    {
        $tenantId     = (string) $notification->{NotificationInterface::ATTR_TENANT_ID};
        $userId       = (string) $notification->{NotificationInterface::ATTR_ADDRESSEE_ID};
        $categorySlug = (string) $notification->{NotificationInterface::ATTR_CATEGORY_SLUG};
        $timezone     = (string) ($notification->{NotificationInterface::ATTR_ADDRESSEE_TIMEZONE} ?? 'UTC');

        $scheduledFor = $this->computeBoundary($digestMode, $timezone, CarbonImmutable::now());

        $digest = $this->digests->findOrCreateBucket(
            $tenantId,
            $userId,
            $categorySlug,
            $channel,
            $scheduledFor,
        );

        // Append the notification id — the notification_ids list on
        // the digest row is the source of truth for what lands in the
        // batch. Preserve existing entries + avoid duplicates.
        $existing = (array) ($digest->{NotificationDigestInterface::ATTR_NOTIFICATION_IDS} ?? []);
        $notificationId = (string) $notification->getKey();

        if (! \in_array($notificationId, $existing, true)) {
            $existing[] = $notificationId;
            $digest->{NotificationDigestInterface::ATTR_NOTIFICATION_IDS} = \array_values($existing);
            $digest->save();
        }

        return $digest;
    }

    /**
     * {@inheritDoc}
     */
    public function findDue(\DateTimeInterface $now): array
    {
        return $this->digests->findDueBefore($now)->all();
    }

    /**
     * {@inheritDoc}
     */
    public function computeBoundary(string $digestMode, string $userTimezone, \DateTimeInterface $now): \DateTimeInterface
    {
        $tz = new \DateTimeZone($userTimezone);
        $current = CarbonImmutable::instance($now)->setTimezone($tz);

        return match ($digestMode) {
            DigestMode::Daily->value => $this->computeDailyBoundary($current),
            DigestMode::Weekly->value => $this->computeWeeklyBoundary($current),
            default => $current, // Immediate + Off — window is now.
        };
    }

    /**
     * Compute the next daily boundary at the configured local time.
     */
    private function computeDailyBoundary(CarbonImmutable $now): CarbonImmutable
    {
        $dailyTime = (string) \config('notifications.digests.daily_time', '08:00');
        [$hour, $minute] = \array_map('intval', \explode(':', $dailyTime));

        $boundary = $now->setTime($hour, $minute);

        return $boundary->lessThanOrEqualTo($now)
            ? $boundary->addDay()
            : $boundary;
    }

    /**
     * Compute the next weekly boundary at the configured day + time.
     */
    private function computeWeeklyBoundary(CarbonImmutable $now): CarbonImmutable
    {
        $weeklyDay = (string) \config('notifications.digests.weekly_day', 'monday');
        $weeklyTime = (string) \config('notifications.digests.weekly_time', '09:00');
        [$hour, $minute] = \array_map('intval', \explode(':', $weeklyTime));

        $boundary = $now->next(\strtolower($weeklyDay))->setTime($hour, $minute);

        return $boundary;
    }
}
