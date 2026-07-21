<?php

declare(strict_types=1);

namespace Stackra\Compliance\Services;

use Stackra\Compliance\Attributes\RetentionPolicy;
use Stackra\Compliance\Contracts\Services\RetentionPolicyResolverInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Resolve the effective retention policy for a model class.
 *
 * Hydrated at boot from every `#[RetentionPolicy]`-marked class.
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultRetentionPolicyResolver implements RetentionPolicyResolverInterface
{
    /**
     * @var array<class-string, RetentionPolicy>
     */
    private array $policies = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, RetentionPolicy $attribute): void
    {
        $this->policies[$className] = $attribute;
    }

    /**
     * {@inheritDoc}
     */
    public function policyFor(string $className): ?RetentionPolicy
    {
        return $this->policies[$className] ?? null;
    }
}
