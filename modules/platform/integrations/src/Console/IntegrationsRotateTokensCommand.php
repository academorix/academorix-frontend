<?php

declare(strict_types=1);

namespace Academorix\Integrations\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Enums\IntegrationKind;
use Academorix\Integrations\Jobs\RefreshIntegrationTokenJob;

/**
 * `php artisan integrations:rotate-tokens` — dispatch
 * {@see RefreshIntegrationTokenJob} for every active integration,
 * optionally filtered by kind.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'integrations:rotate-tokens',
    description: 'Dispatch RefreshIntegrationTokenJob for every active integration (optionally filtered by kind).',
)]
final class IntegrationsRotateTokensCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'integrations:rotate-tokens {--kind= : Limit to a single IntegrationKind backing value}';

    public function handle(TenantIntegrationRepositoryInterface $integrations): int
    {
        $this->omni->titleBar('Rotate Integration Tokens', 'sky');

        $query = $integrations->query()
            ->where(TenantIntegrationInterface::ATTR_IS_ACTIVE, true);

        $kindOption = $this->option('kind');
        if (\is_string($kindOption) && $kindOption !== '') {
            $kind = IntegrationKind::tryFrom($kindOption);
            if ($kind === null) {
                $this->omni->error(\sprintf('Unknown integration kind "%s".', $kindOption));
                $this->showDuration();

                return self::FAILURE;
            }
            $query->where(TenantIntegrationInterface::ATTR_KIND, $kind->value);
        }

        $rows = $query->get();

        if ($rows->isEmpty()) {
            $this->omni->info('No active integrations matched.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $integration) {
            RefreshIntegrationTokenJob::dispatch((string) $integration->getKey());
        }

        $this->omni->success(\sprintf(
            'Dispatched %d RefreshIntegrationTokenJob(s).',
            $rows->count(),
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
