<?php

declare(strict_types=1);

namespace Academorix\Localization\Policies;

use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Translation}.
 *
 * Platform admins reach the cross-tenant read via `platformViewAny`;
 * tenant users are restricted to rows where `tenant_id` matches the
 * caller's tenant (mirroring the query-scope filter). Platform
 * defaults (`tenant_id IS NULL`) are readable by everyone with
 * `translations.viewAny` — they are the platform-shipped copy.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationPolicy
{
    /**
     * `viewAny` — list translations. Tenant users see their own
     * rows + platform defaults; platform admins see everything.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TranslationsViewAny->value)
            || $user->can(LocalizationPermission::PlatformTranslationsViewAny->value);
    }

    /**
     * `view` — read one row scoped to the caller.
     */
    public function view(Authenticatable $user, Translation $translation): bool
    {
        if ($user->can(LocalizationPermission::PlatformTranslationsViewAny->value)) {
            return true;
        }

        if (! $user->can(LocalizationPermission::TranslationsView->value)) {
            return false;
        }

        return $this->belongsToUserTenantOrPlatformDefault($user, $translation);
    }

    /**
     * `create` — tenant admin creates a translation override.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TranslationsCreate->value);
    }

    /**
     * `update` — tenant admin edits an existing row.
     */
    public function update(Authenticatable $user, Translation $translation): bool
    {
        if (! $user->can(LocalizationPermission::TranslationsUpdate->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $translation);
    }

    /**
     * `delete` — tenant admin deletes a translation row.
     */
    public function delete(Authenticatable $user, Translation $translation): bool
    {
        if (! $user->can(LocalizationPermission::TranslationsDelete->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $translation);
    }

    /**
     * `verify` — translation reviewer marks a row as verified.
     */
    public function verify(Authenticatable $user, Translation $translation): bool
    {
        if (! $user->can(LocalizationPermission::TranslationsVerify->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $translation);
    }

    /**
     * `platformViewAny` — cross-tenant read for platform admins.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::PlatformTranslationsViewAny->value);
    }

    /**
     * Row's tenant matches the caller's tenant.
     */
    private function belongsToUserTenant(Authenticatable $user, Translation $translation): bool
    {
        $rowTenantId  = $translation->{TranslationInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }

    /**
     * Row belongs to the caller's tenant OR is a platform default
     * (readable by everyone with the read permission).
     */
    private function belongsToUserTenantOrPlatformDefault(
        Authenticatable $user,
        Translation $translation,
    ): bool {
        $rowTenantId = $translation->{TranslationInterface::ATTR_TENANT_ID} ?? null;

        // Platform default row — visible to anyone who can view any.
        if ($rowTenantId === null) {
            return true;
        }

        return $this->belongsToUserTenant($user, $translation);
    }
}
