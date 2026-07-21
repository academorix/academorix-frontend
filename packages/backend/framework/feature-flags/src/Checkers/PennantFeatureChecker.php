<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Checkers;

use Stackra\FeatureFlags\Contracts\FeatureCheckerInterface;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;
use Stackra\FeatureFlags\Resolver\FeatureResolution;
use Stackra\FeatureFlags\Resolver\FeatureResolver;
use Stackra\FeatureFlags\Resolver\ResolutionContext;
use Stackra\FeatureFlags\Support\ScopePath;
use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Tenancy\Models\Tenant;
use Stackra\User\Models\User;
use BackedEnum;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use InvalidArgumentException;
use RuntimeException;

/**
 * Concrete `FeatureCheckerInterface` implementation.
 *
 * The one seam every non-package consumer routes through. Owns
 * argument normalisation, tenant-context resolution, ScopePath
 * hydration, cache read/write, resolver invocation, and cache
 * TTL rules — kill-switch resolutions capped at 60s regardless
 * of declared TTL (Requirement 10.7).
 *
 * Cache-key layout: `feature_flags:{tenant_id}:{user_id}:{flag}`.
 * Empty tenant/user slots collapse to `-` sentinels so the key
 * shape stays stable.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class PennantFeatureChecker implements FeatureCheckerInterface
{
    /**
     * Per-request memoisation of resolutions keyed by cache key.
     *
     * @var array<string, FeatureResolution>
     */
    private array $memo = [];

    /**
     * @param  FeatureFlagRegistry     $registry            Runtime flag registry.
     * @param  FeatureResolver         $resolver            The composed layer pipeline.
     * @param  ScopeContextInterface   $scopeContext        Request-scoped scope-framework context.
     * @param  CacheRepository         $cache               Cache store used for cross-request resolution caching.
     * @param  int                     $defaultTtlSeconds   Default cache TTL when no per-flag TTL is declared.
     * @param  int                     $killSwitchMaxTtl    Hard cap on kill-switch resolution TTL (Req 10.7).
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureResolver $resolver,
        private readonly ScopeContextInterface $scopeContext,
        private readonly CacheRepository $cache,
        #[Config('feature-flags.cache_ttl', 300)]
        private readonly int $defaultTtlSeconds = 300,
        #[Config('feature-flags.kill_switch_max_ttl', 60)]
        private readonly int $killSwitchMaxTtl = 60,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function active(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): bool
    {
        return $this->resolution($flag, $tenant, $user)->value;
    }

    /**
     * {@inheritDoc}
     */
    public function inactive(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): bool
    {
        return ! $this->active($flag, $tenant, $user);
    }

    /**
     * {@inheritDoc}
     */
    public function values(array $flags, ?Tenant $tenant = null, ?User $user = null): array
    {
        if ($flags === []) {
            return [];
        }

        if (\count($flags) > 100) {
            throw new InvalidArgumentException('Feature flag list may not exceed 100 elements.');
        }

        $out = [];
        foreach ($flags as $flag) {
            $name       = $this->normaliseFlag($flag);
            $out[$name] = $this->active($name, $tenant, $user);
        }

        return $out;
    }

    /**
     * {@inheritDoc}
     */
    public function resolution(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): FeatureResolution
    {
        $name       = $this->normaliseFlag($flag);
        $definition = $this->registry->get($name);

        if ($definition === null) {
            return FeatureResolution::defaultOff();
        }

        $tenant   = $tenant ?? $this->resolveCurrentTenant();
        $cacheKey = $this->buildCacheKey($name, $tenant, $user);

        if (isset($this->memo[$cacheKey])) {
            return $this->memo[$cacheKey];
        }

        $cached = $this->cache->get($cacheKey);
        if ($cached instanceof FeatureResolution) {
            return $this->memo[$cacheKey] = $cached;
        }

        $context    = new ResolutionContext(
            flag: $name,
            tenant: $tenant,
            user: $user,
            definition: $definition,
            scopePath: ScopePath::fromScopeContext($this->scopeContext),
        );
        $resolution = $this->resolver->resolve($context);

        $ttl = $this->resolveTtl($definition->cacheTtl, $resolution);
        $this->cache->put($cacheKey, $resolution, $ttl);
        $this->memo[$cacheKey] = $resolution;

        return $resolution;
    }

    /**
     * Normalise a flag argument to its string identifier.
     *
     * @param  string|BackedEnum  $flag  Flag identifier or enum instance.
     * @return string                    Non-empty string of 1..191 chars.
     *
     * @throws InvalidArgumentException  When the flag identifier is invalid (Req 4.4).
     */
    private function normaliseFlag(string|BackedEnum $flag): string
    {
        if ($flag instanceof BackedEnum) {
            $flag = (string) $flag->value;
        }

        $length = \strlen($flag);
        if ($length < 1 || $length > 191) {
            throw new InvalidArgumentException(
                'Feature flag identifier must be a non-empty string of 1..191 characters.',
            );
        }

        return $flag;
    }

    /**
     * Resolve the current tenant from the tenancy context helper.
     *
     * Returns null when no tenant is available — the resolver's
     * `DefaultLayer` handles the no-tenant short-circuit
     * (Requirement 3.8). Missing tenant only raises when a
     * caller explicitly opted into a tenant-required code path,
     * which happens inside the layers, not here.
     *
     * @return Tenant|null
     */
    private function resolveCurrentTenant(): ?Tenant
    {
        if (! \function_exists('tenant')) {
            return null;
        }

        /** @var Tenant|null $tenant */
        $tenant = tenant();

        return $tenant;
    }

    /**
     * Build the cache key for a `(flag, tenant, user)` triple.
     *
     * @param  string       $flag    Normalised flag identifier.
     * @param  Tenant|null  $tenant  Active tenant or null.
     * @param  User|null    $user    Active user or null.
     * @return string
     */
    private function buildCacheKey(string $flag, ?Tenant $tenant, ?User $user): string
    {
        $tenantId = $tenant !== null ? (string) $tenant->getKey() : '-';
        $userId   = $user !== null ? (string) $user->getKey() : '-';

        return \sprintf('feature_flags:%s:%s:%s', $tenantId, $userId, $flag);
    }

    /**
     * Return the effective cache TTL for a resolution.
     *
     * Kill-switch resolutions are capped at `$killSwitchMaxTtl`
     * seconds regardless of declared TTL (Requirement 10.7).
     *
     * @param  int|null            $declared    Per-flag TTL from the definition, or null to inherit.
     * @param  FeatureResolution   $resolution  The resolution about to be cached.
     * @return int                              Effective TTL in seconds.
     */
    private function resolveTtl(?int $declared, FeatureResolution $resolution): int
    {
        $ttl = $declared ?? $this->defaultTtlSeconds;

        if ($resolution->source === 'kill_switch') {
            return \min($ttl, $this->killSwitchMaxTtl);
        }

        return $ttl;
    }
}
