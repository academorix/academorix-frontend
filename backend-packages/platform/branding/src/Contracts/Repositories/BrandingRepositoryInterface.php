<?php

declare(strict_types=1);

namespace Academorix\Branding\Contracts\Repositories;

use Academorix\Branding\Models\Branding;
use Academorix\Branding\Repositories\EloquentBrandingRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Branding}.
 *
 * @extends RepositoryInterface<Branding>
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Bind(EloquentBrandingRepository::class)]
interface BrandingRepositoryInterface extends RepositoryInterface
{
    /**
     * The default branding profile for a tenant (exactly one row per
     * tenant with `is_default = true`). Returns `null` for tenants
     * that haven't provisioned a branding profile yet.
     */
    public function findDefaultForTenant(string $tenantId): ?Branding;

    /**
     * The branding profile bound to a specific domain (per-domain
     * branding — federation with regional sub-brands, day/night variants).
     */
    public function findForDomain(string $tenantId, string $domainId): ?Branding;

    /**
     * Every branding profile owned by a tenant.
     *
     * @return Collection<int, Branding>
     */
    public function findByTenant(string $tenantId): Collection;
}
