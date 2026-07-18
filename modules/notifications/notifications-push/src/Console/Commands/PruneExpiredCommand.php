<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Push\Jobs\PruneExpiredSubscriptionsJob;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `notifications:push:prune-expired` — enqueue the idle-prune job.
 *
 * Dispatches {@see PruneExpiredSubscriptionsJob} on the notifications queue.
 * `--dry-run` short-circuits before dispatch — used by operators to preview
 * the row count without actually deleting.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:push:prune-expired',
    description: 'Prune idle push subscriptions past the retention window.',
)]
final class PruneExpiredCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:push:prune-expired {--dry-run}';

    /**
     * @var string
     */
    protected $description = 'Prune idle push subscriptions past the retention window.';

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            $this->info('Dry-run — no prune enqueued.');

            return self::SUCCESS;
        }

        PruneExpiredSubscriptionsJob::dispatch();
        $this->info('Prune job dispatched to the notifications queue.');

        return self::SUCCESS;
    }
}
