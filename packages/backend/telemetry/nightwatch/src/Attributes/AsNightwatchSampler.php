<?php

declare(strict_types=1);

/**
 * Nightwatch Sampler Attribute.
 *
 * Mark a class as a Nightwatch dynamic sampler for automatic discovery.
 * Samplers determine at runtime whether a given execution context
 * (request, command) should be sampled by Nightwatch.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Stackra\Nightwatch\Contracts\NightwatchSampler
 * @see \Stackra\Nightwatch\Compiler\NightwatchCompiler
 */

namespace Stackra\Nightwatch\Attributes;

use Attribute;

/**
 * Nightwatch Sampler Attribute.
 *
 * Mark a class as a Nightwatch dynamic sampler for automatic discovery.
 * Samplers determine at runtime whether a given execution context
 * (request, command) should be sampled by Nightwatch.
 *
 * ## Usage:
 *
 * ```php
 * #[AsNightwatchSampler]
 * class AdminSampler implements NightwatchSampler
 * {
 *     public function shouldSample(Request $request): bool|null
 *     {
 *         // Always sample admin requests
 *         if ($request->user()?->isAdmin()) {
 *             return true;
 *         }
 *
 *         // Defer to default sampling
 *         return null;
 *     }
 *
 *     public function priority(): int
 *     {
 *         return 100;
 *     }
 * }
 * ```
 *
 * @see \Stackra\Nightwatch\Contracts\NightwatchSampler
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNightwatchSampler
{
    /**
     * @param string|null $description Optional description
     */
    public function __construct(
        public ?string $description = null,
    ) {}
}
