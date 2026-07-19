<?php

declare(strict_types=1);

namespace Academorix\Localization\Policies;

use Academorix\Localization\Contracts\Data\TenantLocaleInterface;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\TenantLocale;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see TenantLocale}.
 *
 * Every ability is same-tenant defensive — the `BelongsToTenant`
 * global scope already filters queries, but the policy re-checks
 * `tenant_id` on model-bound routes to reject cross-tenant lookups
 * with a clean 404.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TenantLocalePolicy
{
    /**
     * `viewAny` — any tenant member lists their tenant's locales.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TenantLocalesViewAny->value);
    }

    /**
     * `view` — any tenant member reads a specific locale row.
     */
    public function view(Authenticatable $user, TenantLocale $tenantLocale): bool
    {
        if (! $user->can(LocalizationPermission::TenantLocalesView->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $tenantLocale);
    }

    /**
     * `manage` — tenant admin or owner mutates the locale (enable,
     * disable, promote to default, ...).
     */
    public function manage(Authenticatable $user, TenantLocale $tenantLocale): bool
    {
        if (! $user->can(LocalizationPermission::TenantLocalesManage->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $tenantLocale);
    }

    /**
     * `create` — tenant admin enables a new locale for the tenant.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TenantLocalesManage->value);
    }

    /**
     * Same-tenant defensive check.
     */
    private function belongsToUserTenant(Authenticatable $user, TenantLocale $tenantLocale): bool
    {
        $userTenantId = $user->getAttribute('tenant_id');
        $rowTenantId  = $tenantLocale->{TenantLocaleInterface::ATTR_TENANT_ID} ?? null;

        if ($userTenantId === null || $rowTenantId === null) {
            return false;
        }

        return (string) $userTenantId === (string) $rowTenantId;
    }
}
