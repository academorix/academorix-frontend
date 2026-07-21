<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Console;

use Stackra\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Enums\OverrideDecision;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

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
#[Signature('feature-flags:disable {flag} {--tenant=} {--user=}')]
#[Description('Disable a feature flag via a deny override or a global kill switch.')]
final class DisableFeatureFlag extends Command
{
    /**
     * @param  FeatureFlagRegistry                    $registry      Flag registry.
     * @param  FeatureOverrideRepositoryInterface     $overrides     Override persistence boundary.
     * @param  FeatureKillSwitchRepositoryInterface   $killSwitches  Kill-switch persistence boundary.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureOverrideRepositoryInterface $overrides,
        private readonly FeatureKillSwitchRepositoryInterface $killSwitches,
    ) {
        parent::__construct();
    }

    /**
     * Handle the command.
     *
     * @return int
     */
    public function handle(): int
    {
        $flag   = (string) $this->argument('flag');
        $tenant = $this->option('tenant');
        $user   = $this->option('user');

        if (! $this->registry->has($flag)) {
            $this->error(\sprintf('Unknown feature flag: %s', $flag));

            return self::FAILURE;
        }

        if ($tenant === null && $user === null) {
            $this->killSwitches->create([
                FeatureKillSwitchInterface::ATTR_FLAG        => $flag,
                FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => 'global',
                FeatureKillSwitchInterface::ATTR_SCOPE_VALUE => null,
                FeatureKillSwitchInterface::ATTR_ENABLED_AT  => Carbon::now(),
            ]);

            $this->info(\sprintf('Activated global kill switch for "%s".', $flag));

            return self::SUCCESS;
        }

        $scopeLevel = $user !== null ? 'user' : 'tenant';
        $scopeValue = (string) ($user ?? $tenant);

        $this->overrides->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => (string) $tenant,
            FeatureOverrideInterface::ATTR_FLAG        => $flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => $scopeLevel,
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $scopeValue,
            FeatureOverrideInterface::ATTR_DECISION    => OverrideDecision::Deny->value,
        ]);

        $this->info(\sprintf('Disabled "%s" for %s = %s.', $flag, $scopeLevel, $scopeValue));

        return self::SUCCESS;
    }
}
