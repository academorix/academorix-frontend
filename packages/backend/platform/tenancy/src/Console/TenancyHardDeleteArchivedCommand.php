<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Jobs\HardDeleteArchivedTenantJob;
use Carbon\CarbonImmutable;

/**
 * `php artisan tenancy:hard-delete-archived` — enumerate archived
 * tenants past the retention window and dispatch
 * {@see HardDeleteArchivedTenantJob} for each.
 *
 * Runs daily via the platform scheduler. `--dry-run` lists the
 * eligible rows without dispatching.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'tenancy:hard-delete-archived',
    description: 'Enumerate archived tenants past the retention window and dispatch hard-delete jobs.',
)]
final class TenancyHardDeleteArchivedCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'tenancy:hard-delete-archived
        {--days=30 : Retention window in days}
        {--dry-run : List eligible rows without dispatching}';

    /**
     * Dispatch a HardDeleteArchivedTenantJob for each eligible tenant.
     */
    public function handle(TenantRepositoryInterface $tenants): int
    {
        $this->omni->titleBar('Hard-Delete Archived Tenants', 'rose');

        $days   = (int) $this->option('days');
        $cutoff = CarbonImmutable::now()->subDays($days);
        $rows   = $tenants->findArchivedOlderThan($cutoff);

        if ($rows->isEmpty()) {
            $this->omni->info(\sprintf('No archived tenants older than %d days.', $days));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Tenant ID', 'Slug', 'Archived At');

        $dryRun     = $this->option('dry-run') === true;
        $dispatched = 0;

        foreach ($rows as $tenant) {
            $this->omni->tableRow(
                (string) $tenant->getKey(),
                (string) $tenant->slug,
                (string) $tenant->archived_at,
            );

            if ($dryRun) {
                continue;
            }

            HardDeleteArchivedTenantJob::dispatch((string) $tenant->getKey());
            $dispatched++;
        }

        if ($dryRun) {
            $this->omni->info(\sprintf('Dry-run — %d tenant(s) would be dispatched.', $rows->count()));
        } else {
            $this->omni->success(\sprintf('Dispatched %d HardDeleteArchivedTenantJob(s).', $dispatched));
        }

        $this->showDuration();

        return self::SUCCESS;
    }
}
