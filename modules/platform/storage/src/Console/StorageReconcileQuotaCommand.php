<?php

declare(strict_types=1);

namespace Academorix\Storage\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Repositories\FileRepositoryInterface;
use Academorix\Storage\Jobs\SyncStorageEntitlementUsageJob;

/**
 * `php artisan storage:reconcile-quota` — dispatch entitlement-usage
 * sync for every tenant with at least one File row (or a specific
 * tenant when `--tenant=` is set).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:reconcile-quota',
    description: 'Sync per-tenant storage usage back to the entitlements service.',
)]
final class StorageReconcileQuotaCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:reconcile-quota {--tenant= : Limit to one tenant id}';

    public function handle(FileRepositoryInterface $files): int
    {
        $this->omni->titleBar('Storage — Reconcile Quota', 'sky');

        if (($only = $this->option('tenant')) !== null && $only !== '') {
            SyncStorageEntitlementUsageJob::dispatch((string) $only);
            $this->omni->success(\sprintf('Queued SyncStorageEntitlementUsageJob for tenant %s.', $only));
            $this->showDuration();

            return self::SUCCESS;
        }

        /** @var array<int, string> $tenantIds */
        $tenantIds = $files->query()
            ->withoutGlobalScopes()
            ->select(FileInterface::ATTR_TENANT_ID)
            ->distinct()
            ->pluck(FileInterface::ATTR_TENANT_ID)
            ->all();

        foreach ($tenantIds as $id) {
            SyncStorageEntitlementUsageJob::dispatch((string) $id);
        }

        $this->omni->success(\sprintf('Queued SyncStorageEntitlementUsageJob for %d tenant(s).', \count($tenantIds)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
