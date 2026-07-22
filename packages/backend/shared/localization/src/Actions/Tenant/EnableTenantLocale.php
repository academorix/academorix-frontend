<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Stackra\Localization\Contracts\Repositories\TenantLocaleRepositoryInterface;
use Stackra\Localization\Data\Requests\CreateTenantLocaleRequestData;
use Stackra\Localization\Data\Resources\TenantLocaleData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant-locales/{language}` — enable a platform
 * language for the caller's tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.tenant_locales.enable')]
#[Post('/api/v1/tenant-locales/{language}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TenantLocalesManage)]
final class EnableTenantLocale
{
    use AsController;

    public function __construct(
        private readonly TenantLocaleRepositoryInterface $tenantLocales,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(
        PlatformLanguage $language,
        CreateTenantLocaleRequestData $data,
    ): TenantLocaleData {
        $tenant = $this->tenantContext->currentOrFail();

        $row = $this->tenantLocales->create([
            TenantLocaleInterface::ATTR_TENANT_ID             => (string) $tenant->getKey(),
            TenantLocaleInterface::ATTR_LANGUAGE_ID           => (string) $language->getKey(),
            TenantLocaleInterface::ATTR_IS_DEFAULT            => $data->isDefault,
            TenantLocaleInterface::ATTR_IS_FALLBACK           => $data->isFallback,
            TenantLocaleInterface::ATTR_IS_ACTIVE             => $data->isActive,
            TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER => $data->autoTranslateDriver,
            TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE     => $data->minQualityScore,
        ]);

        $row->load('language');

        return TenantLocaleData::fromModel($row);
    }
}
