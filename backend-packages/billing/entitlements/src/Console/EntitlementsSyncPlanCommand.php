<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Entitlements\Jobs\SyncEntitlementsFromPlanJob;

/**
 * `php artisan entitlements:sync-plan {tenant} {plan_id}` — dispatch
 * a `SyncEntitlementsFromPlanJob` for the given (tenant, plan) tuple.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:sync-plan',
    description: 'Sync a tenant\'s entitlements against a subscription plan.',
)]
final class EntitlementsSyncPlanCommand extends BaseCommand
{
    protected $signature = 'entitlements:sync-plan
        {tenant : Tenant id to sync}
        {plan_id : Subscription plan id to sync from}';

    public function handle(): int
    {
        $this->omni->titleBar('Entitlements — Sync Plan', 'sky');

        $tenant = (string) $this->argument('tenant');
        $plan   = (string) $this->argument('plan_id');

        SyncEntitlementsFromPlanJob::dispatch($tenant, $plan);
        $this->omni->success(\sprintf(
            'Sync dispatched for tenant "%s" from plan "%s".',
            $tenant,
            $plan,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
