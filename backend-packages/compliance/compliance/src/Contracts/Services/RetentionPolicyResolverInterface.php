<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Services;

use Academorix\Compliance\Attributes\RetentionPolicy;
use Academorix\Compliance\Services\DefaultRetentionPolicyResolver;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolve the effective retention policy for a model class.
 *
 * Hydrated at boot from every `#[RetentionPolicy]`-marked class so
 * the retention runner can consult the resolver rather than
 * re-reading attribute metadata on every sweep.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultRetentionPolicyResolver::class)]
interface RetentionPolicyResolverInterface
{
    /**
     * Register a `#[RetentionPolicy]` class.
     *
     * @param  class-string    $className  FQCN of the model.
     * @param  RetentionPolicy $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(RetentionPolicy::class)]
    public function register(string $className, RetentionPolicy $attribute): void;

    /**
     * The resolved policy for one model class, or null when no
     * inline attribute is present.
     *
     * @param  class-string  $className  FQCN to look up.
     */
    public function policyFor(string $className): ?RetentionPolicy;
}
