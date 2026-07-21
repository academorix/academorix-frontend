<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Services;

use Stackra\Versioning\Services\DefaultVersionResolverChain;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Http\Request;

/**
 * Ordered chain of {@see VersionResolverInterface} implementations.
 *
 * The chain iterates resolvers in the order declared by
 * `versioning.resolvers.order` and returns the first non-null answer.
 * The `versioning.resolve` middleware calls the chain once per
 * request; downstream code reads the resolved slug from the request
 * attribute the middleware binds.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(DefaultVersionResolverChain::class)]
interface VersionResolverChainInterface
{
    /**
     * Run every registered resolver in order and return the first
     * non-null slug, or `null` when none of them match.
     */
    public function resolve(Request $request): ?string;

    /**
     * Append a resolver to the tail of the chain.
     */
    public function register(VersionResolverInterface $resolver): void;
}
