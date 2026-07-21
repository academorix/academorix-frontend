<?php

declare(strict_types=1);

namespace Stackra\Subscription\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Contracts\Services\DunningOrchestratorInterface;
use Stackra\Subscription\Jobs\AdvanceDunningStageJob;
use Carbon\CarbonImmutable;

/**
 * `php artisan subscription:advance-dunning` — manually run the
 * dunning progression.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:advance-dunning',
    description: 'Run the dunning progression manually. `--dry-run` reports intent only.',
)]
final class SubscriptionAdvanceDunningCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'subscription:advance-dunning
        {--dry-run : Report the transitions that would fire without applying them}';

    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        DunningOrchestratorInterface $dunning,
    ): int {
        $this->omni->titleBar('Subscription — Advance Dunning', 'sky');

        $dryRun = (bool) $this->option('dry-run');

        if (! $dryRun) {
            AdvanceDunningStageJob::dispatch();
            $this->omni->success('AdvanceDunningStageJob dispatched.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $due = $subscriptions->findDueForDunningAdvance(CarbonImmutable::now());
        if ($due->count() === 0) {
            $this->omni->info('No subscriptions due for dunning advance.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Subscription', 'Current State', 'Next Stage');
        foreach ($due as $subscription) {
            $this->omni->tableRow(
                (string) $subscription->getKey(),
                (string) $subscription->{\Stackra\Subscription\Contracts\Data\SubscriptionInterface::ATTR_STATE},
                (string) ($dunning->nextStage($subscription) ?? '—'),
            );
        }

        $this->omni->info(\sprintf(
            '%d subscription(s) would advance. No changes applied (dry run).',
            $due->count(),
        ));

        $this->showDuration();

        return self::SUCCESS;
    }
}
