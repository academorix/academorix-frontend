<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver;

use Stackra\FeatureFlags\Registry\FeatureDefinition;
use Stackra\FeatureFlags\Support\ScopePath;
use Stackra\Tenancy\Models\Tenant;
use Stackra\User\Models\User;

/**
 * Immutable bundle of every input a `ResolverLayer::apply()` reads.
 *
 * Hydrated once per evaluation by `PennantFeatureChecker` and
 * threaded through the fixed KillSwitch → Override → Rollout →
 * PlanGate → Default chain without any layer re-fetching inputs.
 * Every field is frozen; a bug in one layer cannot mutate what a
 * subsequent layer sees.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final readonly class ResolutionContext
{
    /**
     * @param  string             $flag        Normalised flag identifier (BackedEnum already unwrapped).
     * @param  Tenant|null        $tenant      Active tenant scope, or `null` in no-tenant contexts (Req 3.8).
     * @param  User|null          $user        Active user scope, or `null` when unauthenticated (Req 4.12).
     * @param  FeatureDefinition  $definition  Registry entry for `$flag` — non-null by construction (Req 3.9 handled upstream).
     * @param  ScopePath          $scopePath   Snapshot of the caller's `(scope_level, scope_value)` chain.
     */
    public function __construct(
        public string $flag,
        public ?Tenant $tenant,
        public ?User $user,
        public FeatureDefinition $definition,
        public ScopePath $scopePath,
    ) {}
}
