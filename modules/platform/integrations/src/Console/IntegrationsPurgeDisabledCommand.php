<?php

declare(strict_types=1);

namespace Academorix\Integrations\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Jobs\PurgeDisabledIntegrationJob;
use Academorix\Integrations\Models\TenantIntegration;

/**
 * `php artisan integrations:purge-disabled` — dispatch
 * {@see PurgeDisabledIntegrationJob} for every soft-deleted
 * integration whose `deleted_at` is older than `--days` (defaults to
 * 30).
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'integrations:purge-disabled',
    description: 'Dispatch PurgeDisabledIntegrationJob for soft-deleted rows older than --days.',
)]
final class IntegrationsPurgeDisabledCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'integrations:purge-disabled {--days=30 : Retention window in days}';

    public function handle(): int
    {
        $this->omni->titleBar('Purge Disabled Integrations', 'sky');

        $days   = (int) $this->option('days');
        $cutoff = \now()->subDays($days);

        $rows = TenantIntegration::onlyTrashed()
            ->where(TenantIntegrationInterface::ATTR_DELETED_AT, '<=', $cutoff)
            ->get();

        if ($rows->isEmpty()) {
            $this->omni->info(\sprintf('No soft-deleted integrations older than %d day(s).', $days));
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $integration) {
            PurgeDisabledIntegrationJob::dispatch((string) $integration->getKey());
        }

        $this->omni->success(\sprintf(
            'Dispatched %d PurgeDisabledIntegrationJob(s).',
            $rows->count(),
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
