<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\FeatureFlags\Contracts\FeatureCheckerInterface;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;
use Throwable;

/**
 * `feature-flags:list` — table view of every registered flag with resolved value.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'feature-flags:list',
    description: 'List every registered feature flag with its resolved value for the current tenant.',
)]
final class ListFeatureFlags extends BaseCommand
{
    /**
     * Handle the command.
     *
     * @param  FeatureFlagRegistry       $registry  Runtime flag registry.
     * @param  FeatureCheckerInterface   $checker   Flag evaluation boundary.
     *
     * @return int  Symfony exit code — 0 on success.
     */
    public function handle(
        FeatureFlagRegistry $registry,
        FeatureCheckerInterface $checker,
    ): int {
        $this->omni->titleBar('Feature Flags', 'sky');

        $flags = $registry->all();
        if ($flags === []) {
            $this->omni->statusInfo('No flags registered', 'the workspace has zero flags in the registry');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('name', 'kind', 'default_off', 'resolved');
        foreach ($flags as $definition) {
            try {
                $resolved = $checker->active($definition->name) ? 'true' : 'false';
            } catch (Throwable) {
                // Fail-soft — a broken resolver on ONE flag should not blank
                // the whole listing. The "—" tells the operator to inspect
                // that flag specifically.
                $resolved = '—';
            }

            $this->omni->tableRow(
                $definition->name,
                $definition->kind->value,
                $definition->defaultOff ? 'true' : 'false',
                $resolved,
            );
        }

        $this->showDuration();

        return self::SUCCESS;
    }
}
