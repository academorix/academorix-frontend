<?php

declare(strict_types=1);

namespace Stackra\Subscription\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Subscription\Contracts\Services\PlanRegistryInterface;

/**
 * `php artisan subscription:seed-plans` — print every discovered
 * `#[AsPlanTier]` profile.
 *
 * A dev-time helper — production apps seed plans from
 * `data/plans.json` via a proper seeder, not this command.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:seed-plans',
    description: 'Print the discovered plan-tier profiles from the PlanRegistry.',
)]
final class SubscriptionSeedPlansCommand extends BaseCommand
{
    public function handle(PlanRegistryInterface $registry): int
    {
        $this->omni->titleBar('Subscription — Registered Plan Tiers', 'sky');

        $tiers = $registry->tiers();
        if ($tiers === []) {
            $this->omni->info('No plan-tier profiles discovered.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Tier', 'Rank', 'Label', 'Bundled Features');
        foreach ($tiers as $tier) {
            $profile = $registry->profileFor($tier);
            if ($profile === null) {
                continue;
            }

            $this->omni->tableRow(
                $tier,
                (string) $profile['rank'],
                $profile['label'],
                \implode(', ', $profile['features']),
            );
        }

        $this->omni->success(\sprintf('%d tier(s) registered.', \count($tiers)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
