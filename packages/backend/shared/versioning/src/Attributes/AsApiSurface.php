<?php

declare(strict_types=1);

namespace Stackra\Versioning\Attributes;

use Attribute;

/**
 * Mark a controller or GraphQL resolver as a versioned API surface.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * via the `#[HydratesFrom]` declaration on
 * {@see \Stackra\Versioning\Contracts\Registry\ApiVersionRegistryInterface::registerSurface()}.
 * Used by build-time checks to guarantee every declared version has a
 * resolver / handler present. Also feeds the `versioning:list` admin
 * surface with the list of surfaces impacted by a given version.
 *
 * ```php
 * #[AsApiSurface(name: 'invitations', versions: ['v1', 'v2'])]
 * final class ListInvitations
 * {
 *     // ...
 * }
 * ```
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsApiSurface
{
    /**
     * @param  string        $name      Surface identifier (e.g. `invitations`, `users`).
     * @param  list<string>  $versions  Version slugs this surface is declared for.
     */
    public function __construct(
        public string $name,
        public array $versions,
    ) {
    }
}
