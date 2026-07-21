<?php

declare(strict_types=1);

namespace Stackra\Activity\Policies;

use Stackra\Activity\Contracts\Data\ActivityInterface;
use Stackra\Activity\Enums\ActivityPermission;
use Stackra\Activity\Models\Activity;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Dual-guard authorization policy for {@see Activity}.
 *
 * Tenant users hit `viewAny` / `view` (Sanctum, `activity.activity.view`);
 * platform admins hit `viewAny` / `view` under a different guard
 * (`activity.activity.view_all`). Rows are read-only — no
 * `create` / `update` / `delete` abilities. Rows come into existence
 * via `HasActivityLog` observers on other models and leave via
 * `PruneActivityLogJob`.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
final class ActivityPolicy
{
    /**
     * `viewAny` — list the feed. Grant when the caller carries EITHER
     * the tenant-view OR the platform cross-tenant-view permission.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(ActivityPermission::View->value)
            || $user->can(ActivityPermission::ViewAll->value);
    }

    /**
     * `view` — read one row.
     *
     * Platform admins see everything (cross-tenant permission gates
     * on the row without further checks). Tenant users see rows only
     * within their own tenant — the `BelongsToTenant` global scope
     * already filters queries; the check here is defence in depth for
     * direct model-binding routes.
     */
    public function view(Authenticatable $user, Activity $activity): bool
    {
        if ($user->can(ActivityPermission::ViewAll->value)) {
            return true;
        }

        if (! $user->can(ActivityPermission::View->value)) {
            return false;
        }

        // Same-tenant check — the resolved tenant on the request lives
        // in the container-bound TenantContext; the row carries its
        // own `tenant_id`. When they diverge, the row belongs to
        // another tenant and must be treated as invisible.
        $rowTenantId = $activity->{ActivityInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
