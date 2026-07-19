<?php

declare(strict_types=1);

namespace Academorix\Search\Policies;

use Academorix\Search\Contracts\Data\SearchIndexInterface;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchIndex;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see SearchIndex}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexPolicy
{
    /**
     * `viewAny` — list the caller's tenant indexes.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::IndexesViewAny);
    }

    /**
     * `view` — read one index. Row is tenant-scoped via BelongsToTenant.
     */
    public function view(Authenticatable $user, SearchIndex $index): bool
    {
        return $this->has($user, SearchPermission::IndexesView)
            && $this->sameTenant($user, $index);
    }

    /**
     * `platformViewAny` — platform-admin cross-tenant list.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::PlatformIndexesViewAny);
    }

    /**
     * `platformView` — platform-admin view of one index.
     */
    public function platformView(Authenticatable $user, SearchIndex $index): bool
    {
        unset($index); // platform admin sees any row.

        return $this->has($user, SearchPermission::PlatformIndexesView);
    }

    /**
     * `platformReindex` — trigger reindex on any tenant's index.
     */
    public function platformReindex(Authenticatable $user, SearchIndex $index): bool
    {
        unset($index);

        return $this->has($user, SearchPermission::PlatformIndexesReindex);
    }

    /**
     * `platformFlush` — drop an index.
     */
    public function platformFlush(Authenticatable $user, SearchIndex $index): bool
    {
        unset($index);

        return $this->has($user, SearchPermission::PlatformIndexesFlush);
    }

    private function has(Authenticatable $user, SearchPermission $permission): bool
    {
        return $user instanceof User && $user->can($permission->value);
    }

    private function sameTenant(Authenticatable $user, SearchIndex $index): bool
    {
        $rowTenant  = $index->{SearchIndexInterface::ATTR_TENANT_ID};
        $userTenant = \property_exists($user, 'tenant_id') ? $user->tenant_id : null;

        return $rowTenant === null || $rowTenant === $userTenant;
    }
}
