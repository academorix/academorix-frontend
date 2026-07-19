<?php

declare(strict_types=1);

namespace Academorix\Integrations\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;

/**
 * `php artisan integrations:list` — enumerate integrations, optionally
 * filtered to a single tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'integrations:list',
    description: 'List Tenant integrations, optionally filtered by tenant id.',
)]
final class IntegrationsListCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'integrations:list {--tenant= : Limit to a single tenant id}';

    public function handle(TenantIntegrationRepositoryInterface $integrations): int
    {
        $this->omni->titleBar('List Integrations', 'sky');

        $query = $integrations->query();

        $tenantOption = $this->option('tenant');
        if (\is_string($tenantOption) && $tenantOption !== '') {
            $query->where(TenantIntegrationInterface::ATTR_TENANT_ID, $tenantOption);
        }

        $rows = $query
            ->orderBy(TenantIntegrationInterface::ATTR_TENANT_ID)
            ->orderBy(TenantIntegrationInterface::ATTR_KIND)
            ->orderBy(TenantIntegrationInterface::ATTR_NAME)
            ->get();

        if ($rows->isEmpty()) {
            $this->omni->info('No integrations found.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Tenant', 'Kind', 'Provider', 'Name', 'Active', 'Last Sync', 'Status');

        foreach ($rows as $integration) {
            $active = (bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE} ? 'yes' : 'no';
            $this->omni->tableRow(
                (string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID},
                (string) $integration->{TenantIntegrationInterface::ATTR_KIND},
                (string) $integration->{TenantIntegrationInterface::ATTR_PROVIDER},
                (string) $integration->{TenantIntegrationInterface::ATTR_NAME},
                $active,
                (string) ($integration->{TenantIntegrationInterface::ATTR_LAST_SYNC_AT} ?? '—'),
                (string) $integration->{TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS},
            );
        }

        $this->omni->success(\sprintf('Listed %d integration(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
