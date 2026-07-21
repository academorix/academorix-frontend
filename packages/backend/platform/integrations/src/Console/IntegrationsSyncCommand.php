<?php

declare(strict_types=1);

namespace Stackra\Integrations\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Stackra\Integrations\Jobs\SyncIntegrationJob;

/**
 * `php artisan integrations:sync {integration}` — dispatch a
 * {@see SyncIntegrationJob} for the given integration.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'integrations:sync',
    description: 'Dispatch a SyncIntegrationJob for the given integration id.',
)]
final class IntegrationsSyncCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'integrations:sync {integration : The tenant_integrations.id (wit_<ulid>)}';

    public function handle(TenantIntegrationRepositoryInterface $integrations): int
    {
        $this->omni->titleBar('Sync Integration', 'sky');

        $id = (string) $this->argument('integration');

        $integration = $integrations->find($id);
        if ($integration === null) {
            $this->omni->error(\sprintf('Integration "%s" not found.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        if ((bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE} !== true) {
            $this->omni->warning(\sprintf('Integration "%s" is disabled — sync skipped.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        SyncIntegrationJob::dispatch($id);

        $this->omni->success(\sprintf('Dispatched SyncIntegrationJob for "%s".', $id));
        $this->showDuration();

        return self::SUCCESS;
    }
}
