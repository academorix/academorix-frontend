<?php

declare(strict_types=1);

namespace Stackra\Localization\Policies;

use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\TranslationJob;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see TranslationJob}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobPolicy
{
    /**
     * `viewAny` — list jobs scoped to the caller's tenant.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TranslationJobsViewAny->value);
    }

    /**
     * `view` — read one job row scoped to the caller's tenant.
     */
    public function view(Authenticatable $user, TranslationJob $job): bool
    {
        if (! $user->can(LocalizationPermission::TranslationJobsView->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $job);
    }

    /**
     * `create` — tenant admin dispatches a bulk translate job.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::TranslationJobsCreate->value);
    }

    /**
     * `cancel` — tenant admin cancels a running job.
     */
    public function cancel(Authenticatable $user, TranslationJob $job): bool
    {
        if (! $user->can(LocalizationPermission::TranslationJobsCancel->value)) {
            return false;
        }

        return $this->belongsToUserTenant($user, $job);
    }

    /**
     * Row's tenant matches the caller's tenant.
     */
    private function belongsToUserTenant(Authenticatable $user, TranslationJob $job): bool
    {
        $rowTenantId  = $job->{TranslationJobInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
