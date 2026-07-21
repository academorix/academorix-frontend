<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Console;

use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Push\Jobs\SendPushJob;
use Illuminate\Support\Str;
use Stackra\Console\Attributes\AsCommand;

/**
 * `notifications:push:test` — send a synthetic push to a user's registered
 * subscriptions.
 *
 * Rate-limited to 10/day per operator by the shared throttle middleware. Used
 * by ops to smoke-test provider connectivity without touching a real Notification.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:push:test',
    description: 'Send a synthetic push to a user\'s registered subscriptions.',
)]
final class TestCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:push:test {recipient_user_id} {--application-id=} {--title=Test} {--body=Hello from notifications:push:test}';

    public function handle(): int
    {
        $userId        = (string) $this->argument('recipient_user_id');
        $applicationId = (string) $this->option('application-id');

        if ($applicationId === '') {
            $this->omni->error('--application-id is required.');

            return self::FAILURE;
        }

        SendPushJob::dispatch(
            notificationId: 'noti_' . Str::ulid()->toBase32(),
            deliveryId: 'ndlv_' . Str::ulid()->toBase32(),
            userId: $userId,
            applicationId: $applicationId,
            title: (string) $this->option('title'),
            body: (string) $this->option('body'),
        );

        $this->omni->success('Test push dispatched.');

        return self::SUCCESS;
    }
}
