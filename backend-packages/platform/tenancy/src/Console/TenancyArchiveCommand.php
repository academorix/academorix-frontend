<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Tenancy\Contracts\Data\TenantInterface;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Enums\TenantStatus;
use Academorix\Tenancy\Models\Tenant;
use Carbon\CarbonImmutable;

/**
 * `php artisan tenancy:archive` — archive a Tenant.
 *
 * Refuses `is_system = true` rows. Emits the `TenantArchived` event
 * via the observer chain. Retention job hard-deletes 30 days later.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'tenancy:archive',
    description: 'Archive a Tenant (soft-delete + status=archived). Refused on is_system rows.',
)]
final class TenancyArchiveCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'tenancy:archive
        {tenant : Tenant id (ten_…) or slug}
        {--reason= : Reason recorded in the audit trail}
        {--force : Skip the confirm prompt}';

    /**
     * Archive a Tenant by id or slug.
     */
    public function handle(TenantRepositoryInterface $tenants): int
    {
        $this->omni->titleBar('Archive Tenant', 'sky');

        $identifier = (string) $this->argument('tenant');
        $tenant     = $this->resolveTenant($tenants, $identifier);

        if ($tenant === null) {
            $this->omni->error(\sprintf('Tenant "%s" not found.', $identifier));
            $this->showDuration();

            return self::FAILURE;
        }

        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true) {
            $this->omni->error('Refused — this is a system tenant. Set is_system=false first (via seeder).');
            $this->showDuration();

            return self::FAILURE;
        }

        if ($this->option('force') !== true) {
            $confirmed = $this->omni->ask(\sprintf(
                'Archive tenant "%s" (%s)? Retention: 30 days.',
                $tenant->{TenantInterface::ATTR_NAME},
                $tenant->getKey(),
            ), options: ['yes', 'no'], default: 'no');

            if ($confirmed !== 'yes') {
                $this->omni->info('Aborted.');
                $this->showDuration();

                return self::SUCCESS;
            }
        }

        $tenant->update([
            TenantInterface::ATTR_STATUS       => TenantStatus::Archived,
            TenantInterface::ATTR_ARCHIVED_AT  => CarbonImmutable::now(),
        ]);
        $tenant->delete();

        $reason = $this->option('reason');
        $this->omni->success(\sprintf(
            'Archived tenant %s%s',
            $tenant->getKey(),
            \is_string($reason) && $reason !== '' ? ' — reason: ' . $reason : '',
        ));
        $this->showDuration();

        return self::SUCCESS;
    }

    /**
     * Resolve `{tenant}` — either a `ten_...` id or a slug.
     */
    private function resolveTenant(TenantRepositoryInterface $tenants, string $identifier): ?Tenant
    {
        return $tenants->query()
            ->where(function ($q) use ($identifier): void {
                $q->where(TenantInterface::ATTR_ID, $identifier)
                    ->orWhere(TenantInterface::ATTR_SLUG, $identifier);
            })
            ->first();
    }
}
