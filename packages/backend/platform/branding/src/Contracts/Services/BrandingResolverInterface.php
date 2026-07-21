<?php

declare(strict_types=1);

namespace Stackra\Branding\Contracts\Services;

use Stackra\Branding\Models\Branding;
use Stackra\Branding\Services\DefaultBrandingResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Per-request branding resolver.
 *
 * Given a `(tenant_id, domain_id?)` pair, returns the branding
 * profile to render for the current request:
 *  1. Per-domain profile when one exists.
 *  2. Otherwise the tenant's `is_default = true` profile.
 *  3. Otherwise `null` (falls back to platform default).
 *
 * Consumer apps may bind a richer resolver that layers in feature-flag
 * overrides / A/B experiments — the default implementation is the
 * straight lookup.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see DefaultBrandingResolver}). Consumers type-hint the
 * interface; the container resolves to the concrete.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Bind(DefaultBrandingResolver::class)]
interface BrandingResolverInterface
{
    /**
     * Resolve the active branding for a tenant + optional domain.
     */
    public function resolve(string $tenantId, ?string $domainId = null): ?Branding;
}
