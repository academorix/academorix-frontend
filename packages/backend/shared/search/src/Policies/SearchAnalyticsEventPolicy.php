<?php

declare(strict_types=1);

namespace Academorix\Search\Policies;

use Academorix\Search\Enums\SearchPermission;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for search analytics events.
 *
 * Only aggregated views are exposed. Row-level analytics access is
 * NOT wired — no `view` ability. Callers reach aggregates via the
 * analytics actions.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchAnalyticsEventPolicy
{
    /**
     * `viewAny` — tenant analytics dashboards.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::AnalyticsView);
    }

    /**
     * `platformViewAny` — cross-tenant analytics for support triage.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::PlatformAnalyticsView);
    }

    private function has(Authenticatable $user, SearchPermission $permission): bool
    {
        return $user instanceof User && $user->can($permission->value);
    }
}
