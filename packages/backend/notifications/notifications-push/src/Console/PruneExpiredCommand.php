<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Console;

use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Push\Jobs\PruneExpiredSubscriptionsJob;
use Stackra\Console\Attributes\AsCommand;

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

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            $this->omni->success('Dry-run — no prune enqueued.');

            return self::SUCCESS;
        }

        PruneExpiredSubscriptionsJob::dispatch();
        $this->omni->success('Prune job dispatched to the notifications queue.');

        return self::SUCCESS;
    }
}
