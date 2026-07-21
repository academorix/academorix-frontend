<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant\TenantLocales;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\TenantLocale;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/tenant-locales/{tenantLocale}` — disable a
 * tenant-locale row. Refused for the tenant's default locale by
 * the observer.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.tenant_locales.disable')]
#[Delete('/api/v1/tenant-locales/{tenantLocale}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TenantLocalesManage)]
final class DisableTenantLocale
{
    use AsController;

    public function __invoke(TenantLocale $tenantLocale): JsonResponse
    {
        $tenantLocale->delete();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
