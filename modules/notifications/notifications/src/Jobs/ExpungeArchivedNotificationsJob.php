<?php

declare(strict_types=1);

namespace Academorix\Notifications\Jobs;

use Academorix\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Hard-delete `Notification` rows past their archived retention
 * window.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(1800)]
#[Tries(2)]
final class ExpungeArchivedNotificationsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $tenantId  Tenant to purge.
     */
    public function __construct(public readonly string $tenantId)
    {
    }

    #[UniqueFor(86400)]
    public function uniqueId(): string
    {
        return 'expunge:' . $this->tenantId;
    }

    /**
     * Execute the purge.
     */
    public function handle(
        NotificationRepositoryInterface $notifications,
        LoggerInterface $log,
    ): void {
        $days = (int) \config('notifications.retention.archived_notification_days', 30);
        $cutoff = CarbonImmutable::now()->subDays($days);

        $archived = $notifications->findArchivedBefore($cutoff);

        $log->info('notifications archived-expunge complete', [
            'tenant_id' => $this->tenantId,
            'candidates' => $archived->count(),
            'cutoff' => $cutoff->toIso8601String(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
