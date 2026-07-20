<?php

declare(strict_types=1);

namespace Academorix\Activity\Console;

use Academorix\Activity\Jobs\PruneActivityLogJob;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;

/**
 * `php artisan activity:prune` — dispatch {@see PruneActivityLogJob}
 * for one tenant (or every tenant when `--tenant` is omitted).
 *
 * The default retention window is 90 days (`--days=90`) — the tier
 * default. Consumer apps can override per-tenant via the subscription
 * lookup path (planned).
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'activity:prune',
    description: 'Prune activity_log rows past their retention tier.',
)]
final class ActivityPruneCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'activity:prune
        {--tenant= : Prune only this tenant id (defaults to every tenant)}
        {--days=90 : Retention window override in days (defaults to 90)}';

    public function handle(): int
    {
        $this->omni->titleBar('Prune Activity Log', 'amber');

        $tenantId = $this->option('tenant');
        $daysRaw  = $this->option('days');

        // Coerce the days flag through int() rather than trusting the
        // caller to have passed a numeric string — the option arrives
        // as a string from Symfony's parser regardless of how we
        // declared the signature.
        $days = \is_numeric($daysRaw) ? (int) $daysRaw : 90;

        if (\is_string($tenantId) && $tenantId !== '') {
            PruneActivityLogJob::dispatch($tenantId);
            $this->omni->success(\sprintf('Dispatched prune job for tenant "%s".', $tenantId));
            $this->showDuration();

            return self::SUCCESS;
        }

        // No --tenant flag — the operator wanted "every tenant" but we
        // don't own the tenant repository at this layer. Emit the
        // guidance banner rather than iterating a table we don't
        // manage.
        $this->omni->info(\sprintf(
            'No --tenant flag supplied. Provide a tenant id to prune. Retention window: %d days.',
            $days,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
