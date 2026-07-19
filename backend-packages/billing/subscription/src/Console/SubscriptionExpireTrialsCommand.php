<?php

declare(strict_types=1);

namespace Academorix\Subscription\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Subscription\Jobs\ExpireTrialsJob;

/**
 * `php artisan subscription:expire-trials` — manually run the
 * trial-expiration sweep.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:expire-trials',
    description: 'Run the trial-expiration sweep manually.',
)]
final class SubscriptionExpireTrialsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'subscription:expire-trials
        {--dry-run : Do not dispatch; report intent only}';

    public function handle(): int
    {
        $this->omni->titleBar('Subscription — Expire Trials', 'sky');

        if ((bool) $this->option('dry-run')) {
            $this->omni->info('Dry run — the trial-expiration job was NOT dispatched.');
            $this->showDuration();

            return self::SUCCESS;
        }

        ExpireTrialsJob::dispatch();

        $this->omni->success('ExpireTrialsJob dispatched.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
