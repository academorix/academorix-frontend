<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Enums\OverrideDecision;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;

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
#[AsCommand(
    name: 'feature-flags:enable',
    description: 'Enable a feature flag for a tenant / user via an allow override.',
)]
final class EnableFeatureFlag extends BaseCommand
{
    protected $signature = 'feature-flags:enable {flag} {--tenant=} {--user=}';

    /**
     * Handle the command.
     *
     * @param  FeatureFlagRegistry                  $registry    Flag registry.
     * @param  FeatureOverrideRepositoryInterface   $overrides   Override persistence boundary.
     *
     * @return int  Symfony exit code — 0 on success, 1 on unknown flag,
     *              2 on invalid usage (missing --tenant AND --user).
     */
    public function handle(
        FeatureFlagRegistry $registry,
        FeatureOverrideRepositoryInterface $overrides,
    ): int {
        $this->omni->titleBar('Enable Feature Flag', 'sky');

        $flag   = (string) $this->argument('flag');
        $tenant = $this->option('tenant');
        $user   = $this->option('user');

        if (! $registry->has($flag)) {
            $this->omni->statusError('Unknown flag', \sprintf('feature flag "%s" is not registered', $flag));
            $this->showDuration();

            return self::FAILURE;
        }

        if ($tenant === null && $user === null) {
            $this->omni->statusWarning('Nothing to enable', 'pass --tenant=<id> and/or --user=<id>');
            $this->showDuration();

            return self::INVALID;
        }

        $scopeLevel = $user !== null ? 'user' : 'tenant';
        $scopeValue = (string) ($user ?? $tenant);

        $overrides->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => (string) $tenant,
            FeatureOverrideInterface::ATTR_FLAG        => $flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => $scopeLevel,
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $scopeValue,
            FeatureOverrideInterface::ATTR_DECISION    => OverrideDecision::Allow->value,
        ]);

        $this->omni->statusSuccess(
            'Flag enabled',
            \sprintf('"%s" for %s = %s', $flag, $scopeLevel, $scopeValue),
        );
        $this->showDuration();

        return self::SUCCESS;
    }
}
