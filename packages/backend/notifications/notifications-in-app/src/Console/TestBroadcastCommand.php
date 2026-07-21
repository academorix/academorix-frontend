<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\InApp\Jobs\BroadcastInAppNotificationJob;

/**
 * `php artisan notifications:in-app:test-broadcast` — dispatch a
 * test broadcast job for a given notification id.
 *
 * Ops uses this to smoke-test the Reverb wiring end-to-end after a
 * deploy or an incident recovery — no need to trigger a real
 * notification through the DispatchGateway.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/commands.json
 *   →  commands: `notifications:in-app:test-broadcast`
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:in-app:test-broadcast',
    description: 'Dispatch a test in-app broadcast job for a notification id.',
)]
final class TestBroadcastCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:in-app:test-broadcast
        {notification : The notification id (not_...) to broadcast}';

    /**
     * Dispatch the broadcast job. Returns SUCCESS as soon as the job
     * is queued — the queue worker owns the outcome.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Test In-App Broadcast', 'sky');

        $notificationId = (string) $this->argument('notification');

        if ($notificationId === '') {
            $this->omni->error('The notification id argument is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        BroadcastInAppNotificationJob::dispatch($notificationId);

        $this->omni->success(\sprintf(
            'Dispatched broadcast job for notification "%s". Check the queue worker + Reverb dashboard for the outcome.',
            $notificationId,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
