<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\TenantLocales;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Repositories\TenantLocaleRepositoryInterface;
use Academorix\Localization\Data\Resources\TenantLocaleData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\TenantLocale;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant-locales` — every locale enabled for the
 * caller's tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.tenant_locales.list')]
#[Get('/api/v1/tenant-locales')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TenantLocalesViewAny)]
final class ListTenantLocales
{
    use AsController;

    public function __construct(
        private readonly TenantLocaleRepositoryInterface $tenantLocales,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, TenantLocaleData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->tenantLocales
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (TenantLocale $tl): TenantLocaleData => TenantLocaleData::fromModel($tl));

        return new DataCollection(TenantLocaleData::class, $rows);
    }
}
