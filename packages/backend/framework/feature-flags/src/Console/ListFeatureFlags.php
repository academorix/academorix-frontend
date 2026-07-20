<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Console;

use Academorix\FeatureFlags\Contracts\FeatureCheckerInterface;
use Academorix\FeatureFlags\Registry\FeatureFlagRegistry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * `feature-flags:list` — table view of every registered flag with resolved value.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Signature('feature-flags:list')]
#[Description('List every registered feature flag with its resolved value for the current tenant.')]
final class ListFeatureFlags extends Command
{
    /**
     * @param  FeatureFlagRegistry       $registry  Runtime flag registry.
     * @param  FeatureCheckerInterface   $checker   Flag evaluation boundary.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureCheckerInterface $checker,
    ) {
        parent::__construct();
    }

    /**
     * Handle the command.
     *
     * @return int  Symfony exit code — 0 on success.
     */
    public function handle(): int
    {
        $rows = [];
        foreach ($this->registry->all() as $definition) {
            try {
                $resolved = $this->checker->active($definition->name) ? 'true' : 'false';
            } catch (\Throwable) {
                $resolved = '—';
            }

            $rows[] = [
                'name'        => $definition->name,
                'kind'        => $definition->kind->value,
                'default_off' => $definition->defaultOff ? 'true' : 'false',
                'resolved'    => $resolved,
            ];
        }

        $this->table(['name', 'kind', 'default_off', 'resolved'], $rows);

        return self::SUCCESS;
    }
}
