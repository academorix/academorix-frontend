<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Console;

use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\FeatureFlags\Enums\OverrideDecision;
use Academorix\FeatureFlags\Registry\FeatureFlagRegistry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * `feature-flags:enable {flag} {--tenant=} {--user=}` — flip a flag on.
 *
 * With `--tenant` and/or `--user` → upsert an `allow` override.
 * Without either → operator intent is a platform enable; the
 * command surfaces the appropriate action.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Signature('feature-flags:enable {flag} {--tenant=} {--user=}')]
#[Description('Enable a feature flag for a tenant / user via an allow override.')]
final class EnableFeatureFlag extends Command
{
    /**
     * @param  FeatureFlagRegistry                  $registry    Flag registry.
     * @param  FeatureOverrideRepositoryInterface   $overrides   Override persistence boundary.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureOverrideRepositoryInterface $overrides,
    ) {
        parent::__construct();
    }

    /**
     * Handle the command.
     *
     * @return int  Symfony exit code — 0 on success, 1 on unknown flag.
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
            $this->warn('No --tenant or --user provided — nothing to enable.');

            return self::INVALID;
        }

        $scopeLevel = $user !== null ? 'user' : 'tenant';
        $scopeValue = (string) ($user ?? $tenant);

        $this->overrides->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => (string) $tenant,
            FeatureOverrideInterface::ATTR_FLAG        => $flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => $scopeLevel,
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $scopeValue,
            FeatureOverrideInterface::ATTR_DECISION    => OverrideDecision::Allow->value,
        ]);

        $this->info(\sprintf('Enabled "%s" for %s = %s.', $flag, $scopeLevel, $scopeValue));

        return self::SUCCESS;
    }
}
