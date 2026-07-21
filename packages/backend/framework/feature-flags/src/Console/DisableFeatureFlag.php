<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Console;

use Illuminate\Support\Carbon;
use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Enums\OverrideDecision;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;

/**
 * `feature-flags:disable {flag} {--tenant=} {--user=}` — flip a flag off.
 *
 * With `--tenant` and/or `--user` → upsert a `deny` override.
 * Without either → activate a global kill switch.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'feature-flags:disable',
    description: 'Disable a feature flag via a deny override or a global kill switch.',
)]
final class DisableFeatureFlag extends BaseCommand
{
    // The AsCommand attribute above owns the name + description; the
    // `{flag} {--tenant=} {--user=}` DSL below still lives on the
    // property because Laravel's input definition is parsed from
    // `$signature`, not from the attribute. Command names in both
    // sources of truth MUST agree.
    protected $signature = 'feature-flags:disable {flag} {--tenant=} {--user=}';

    /**
     * Handle the command. Repositories arrive via method injection —
     * Laravel's container resolves each type-hinted parameter through
     * `Container::call()` at invoke time.
     *
     * @param  FeatureFlagRegistry                    $registry      Flag registry.
     * @param  FeatureOverrideRepositoryInterface     $overrides     Override persistence boundary.
     * @param  FeatureKillSwitchRepositoryInterface   $killSwitches  Kill-switch persistence boundary.
     */
    public function handle(
        FeatureFlagRegistry $registry,
        FeatureOverrideRepositoryInterface $overrides,
        FeatureKillSwitchRepositoryInterface $killSwitches,
    ): int {
        $this->omni->titleBar('Disable Feature Flag', 'sky');

        $flag   = (string) $this->argument('flag');
        $tenant = $this->option('tenant');
        $user   = $this->option('user');

        if (! $registry->has($flag)) {
            $this->omni->statusError('Unknown flag', \sprintf('feature flag "%s" is not registered', $flag));
            $this->showDuration();

            return self::FAILURE;
        }

        if ($tenant === null && $user === null) {
            $killSwitches->create([
                FeatureKillSwitchInterface::ATTR_FLAG        => $flag,
                FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => 'global',
                FeatureKillSwitchInterface::ATTR_SCOPE_VALUE => null,
                FeatureKillSwitchInterface::ATTR_ENABLED_AT  => Carbon::now(),
            ]);

            $this->omni->statusSuccess('Kill switch activated', \sprintf('global kill switch for "%s"', $flag));
            $this->showDuration();

            return self::SUCCESS;
        }

        $scopeLevel = $user !== null ? 'user' : 'tenant';
        $scopeValue = (string) ($user ?? $tenant);

        $overrides->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => (string) $tenant,
            FeatureOverrideInterface::ATTR_FLAG        => $flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => $scopeLevel,
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $scopeValue,
            FeatureOverrideInterface::ATTR_DECISION    => OverrideDecision::Deny->value,
        ]);

        $this->omni->statusSuccess(
            'Flag disabled',
            \sprintf('"%s" for %s = %s', $flag, $scopeLevel, $scopeValue),
        );
        $this->showDuration();

        return self::SUCCESS;
    }
}
