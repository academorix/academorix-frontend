<?php

declare(strict_types=1);

namespace Stackra\Branding\Services;

use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Contracts\Services\BrandingResolverInterface;
use Stackra\Branding\Models\Branding;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default per-request branding resolver.
 *
 * Resolution order:
 *  1. Per-domain profile when `domain_id` is passed + a match exists.
 *  2. Otherwise the tenant's `is_default = true` profile.
 *  3. Otherwise `null`.
 *
 * `#[Scoped]` — one instance per request; safe to inject into other
 * scoped services.
 *
 * The container binding lives on the interface
 * ({@see BrandingResolverInterface}) per Laravel-canonical placement
 * — this concrete only carries lifetime metadata (`#[Scoped]`).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultBrandingResolver implements BrandingResolverInterface
{
    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $tenantId, ?string $domainId = null): ?Branding
    {
        if ($domainId !== null) {
            $match = $this->brandings->findForDomain($tenantId, $domainId);
            if ($match !== null) {
                return $match;
            }
        }

        return $this->brandings->findDefaultForTenant($tenantId);
    }
}
