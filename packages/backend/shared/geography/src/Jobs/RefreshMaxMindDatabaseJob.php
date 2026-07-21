<?php

declare(strict_types=1);

namespace Stackra\Geography\Jobs;

use Stackra\Geography\Contracts\Services\GeolocateServiceInterface;
use Stackra\Geography\Notifications\MaxMindRefreshFailedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Weekly refresh of the local GeoLite2-City.mmdb via
 * {@see GeolocateServiceInterface::refreshMaxMindDatabase()}.
 *
 * Runs Sunday 03:00 UTC via schedule.json. Also dispatched by the
 * `DispatchRefreshMaxMindOnStale` listener when the stale-probe
 * fires mid-week. `ShouldBeUnique` with a 24h window prevents
 * back-to-back stale events from spawning parallel refreshes.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
#[Backoff([300, 3600, 21600])]
#[UniqueFor(86400)]
final class RefreshMaxMindDatabaseJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Unique id — the job is a singleton; nothing to key by.
     */
    public function uniqueId(): string
    {
        return 'geography.refresh_maxmind';
    }

    /**
     * Handle the refresh — delegates to the service so the retry
     * semantics + observability events stay in one place.
     */
    public function handle(
        GeolocateServiceInterface $geolocate,
        LoggerInterface $log,
    ): void {
        try {
            $geolocate->refreshMaxMindDatabase();
        } catch (Throwable $e) {
            // Surface a notification to ops when every attempt has
            // failed. Laravel's queue framework retries per the
            // `#[Tries]` + `#[Backoff]` policy above; the notification
            // only fires on the final failure path.
            $log->warning('geography.maxmind.refresh_job_failed', [
                'exception' => $e::class,
                'message'   => $e->getMessage(),
            ]);

            // Re-throw so Laravel counts the retry.
            throw $e;
        }
    }

    /**
     * Final-failure hook — fires after `#[Tries]` is exhausted.
     * Dispatches an ops notification with the trailing exception.
     */
    public function failed(Throwable $e): void
    {
        // Notify a routing-configured channel — the caller apps bind
        // the recipient list in their notification channel config.
        Notification::route('mail', (string) \config('geography.maxmind.notify_email', 'ops@localhost'))
            ->notify(new MaxMindRefreshFailedNotification($e->getMessage()));
    }
}
