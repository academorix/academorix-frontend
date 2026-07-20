<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Mail\Jobs\ReconcileSuppressionsJob;

/**
 * `php artisan notifications:mail:reconcile-suppressions` — pull
 * provider-side suppression lists and sync missing entries.
 *
 * Runs weekly from the scheduler (Sunday 04 UTC per blueprint
 * `schedule.json`). Can be invoked manually with `--dry-run` for
 * ops to preview drift before committing.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/commands.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:mail:reconcile-suppressions',
    description: 'Reconcile provider-side mail suppression lists with ours.',
)]
final class ReconcileSuppressionsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:mail:reconcile-suppressions
        {--provider= : Restrict to one provider}
        {--dry-run : Preview without writing}';

    /**
     * Dispatch the reconciliation job.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Reconcile Mail Suppressions', 'sky');

        $provider = $this->option('provider');
        $providerSlug = \is_string($provider) && $provider !== '' ? $provider : null;
        $dryRun = (bool) $this->option('dry-run');

        ReconcileSuppressionsJob::dispatch($providerSlug, $dryRun);

        $this->omni->success(\sprintf(
            'Dispatched reconciliation job (provider=%s, dry_run=%s).',
            $providerSlug ?? 'all',
            $dryRun ? 'true' : 'false',
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
