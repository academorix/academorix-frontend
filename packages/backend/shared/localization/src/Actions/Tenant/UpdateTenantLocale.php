<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Data\Requests\UpdateTenantLocaleRequestData;
use Stackra\Localization\Data\Resources\TenantLocaleData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\TenantLocale;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\Optional;

/**
 * `PATCH /api/v1/tenant-locales/{tenantLocale}` — update one
 * tenant-locale row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.tenant_locales.update')]
#[Patch('/api/v1/tenant-locales/{tenantLocale}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TenantLocalesManage)]
final class UpdateTenantLocale
{
    use AsController;

    public function __invoke(
        TenantLocale $tenantLocale,
        UpdateTenantLocaleRequestData $data,
    ): TenantLocaleData {
        $attributes = [];

        if (! $data->isDefault instanceof Optional) {
            $attributes['is_default'] = $data->isDefault;
        }

        if (! $data->isFallback instanceof Optional) {
            $attributes['is_fallback'] = $data->isFallback;
        }

        if (! $data->isActive instanceof Optional) {
            $attributes['is_active'] = $data->isActive;
        }

        if (! $data->autoTranslateDriver instanceof Optional) {
            $attributes['auto_translate_driver'] = $data->autoTranslateDriver;
        }

        if (! $data->minQualityScore instanceof Optional) {
            $attributes['min_quality_score'] = $data->minQualityScore;
        }

        $tenantLocale->fill($attributes)->save();
        $tenantLocale->load('language');

        return TenantLocaleData::fromModel($tenantLocale);
    }
}
