<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Push\Jobs\SendPushJob;
use Illuminate\Support\Str;
use Symfony\Component\Console\Attribute\AsCommand;

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

    /**
     * @var string
     */
    protected $description = 'Send a synthetic push to a user\'s registered subscriptions.';

    public function handle(): int
    {
        $userId        = (string) $this->argument('recipient_user_id');
        $applicationId = (string) $this->option('application-id');

        if ($applicationId === '') {
            $this->error('--application-id is required.');

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

        $this->info('Test push dispatched.');

        return self::SUCCESS;
    }
}
