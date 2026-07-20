<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Jobs\ResetPeriodicUsageJob;

/**
 * `php artisan entitlements:reset {--tenant=} {--key=}` — dispatch
 * a `ResetPeriodicUsageJob` for one tenant's key (or every pool-kind
 * row when both options are omitted).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:reset',
    description: 'Reset pool-kind entitlement counters at period boundaries.',
)]
final class EntitlementsResetCommand extends BaseCommand
{
    protected $signature = 'entitlements:reset
        {--tenant= : Reset only this tenant\'s entitlements}
        {--key= : Reset only this key on the tenant (requires --tenant)}';

    public function handle(EntitlementRepositoryInterface $entitlements): int
    {
        $this->omni->titleBar('Entitlements — Reset', 'sky');

        $tenant = $this->option('tenant');
        $key    = $this->option('key');

        if (\is_string($tenant) && \is_string($key)) {
            $row = $entitlements->findByKey($tenant, $key);
            if ($row === null) {
                $this->omni->error(\sprintf('No entitlement "%s" on tenant "%s".', $key, $tenant));

                return self::FAILURE;
            }

            ResetPeriodicUsageJob::dispatch((string) $row->getKey());
            $this->omni->success(\sprintf('Reset dispatched for "%s" on tenant "%s".', $key, $tenant));

            $this->showDuration();

            return self::SUCCESS;
        }

        // Bulk reset — no targeting.
        ResetPeriodicUsageJob::dispatch(null);
        $this->omni->success('Bulk reset job dispatched for every expiring entitlement.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
