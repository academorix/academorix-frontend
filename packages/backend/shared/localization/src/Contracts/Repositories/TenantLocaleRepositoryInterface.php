<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Localization\Models\TenantLocale;
use Academorix\Localization\Repositories\EloquentTenantLocaleRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see TenantLocale}.
 *
 * @extends RepositoryInterface<TenantLocale>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(EloquentTenantLocaleRepository::class)]
interface TenantLocaleRepositoryInterface extends RepositoryInterface
{
    /**
     * Every locale enabled for the tenant, active + inactive.
     *
     * @param  string  $tenantId  Tenant to scope by.
     * @return Collection<int, TenantLocale>
     */
    public function findByTenant(string $tenantId): Collection;

    /**
     * The row where `is_default=true` for the tenant, or null.
     *
     * @param  string  $tenantId  Tenant to scope by.
     */
    public function findDefaultForTenant(string $tenantId): ?TenantLocale;

    /**
     * The row where `is_fallback=true` for the tenant, or null.
     *
     * @param  string  $tenantId  Tenant to scope by.
     */
    public function findFallbackForTenant(string $tenantId): ?TenantLocale;

    /**
     * Look up an enablement row by the `(tenant_id, language_id)`
     * composite. Present so callers can pre-check duplicates before
     * hitting the observer.
     *
     * @param  string  $tenantId    Tenant to scope by.
     * @param  string  $languageId  Platform-language id.
     */
    public function findByComposite(string $tenantId, string $languageId): ?TenantLocale;
}
