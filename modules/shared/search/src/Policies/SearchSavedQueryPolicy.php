<?php

declare(strict_types=1);

namespace Academorix\Search\Policies;

use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSavedQuery;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see SearchSavedQuery}.
 *
 * A caller can view own rows + tenant-shared rows. Mutating actions
 * are gated on ownership.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSavedQueryPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::SavedQueriesViewAny);
    }

    public function view(Authenticatable $user, SearchSavedQuery $query): bool
    {
        if (! $this->has($user, SearchPermission::SavedQueriesView)) {
            return false;
        }

        return $this->isOwn($user, $query)
            || (bool) $query->{SearchSavedQueryInterface::ATTR_IS_SHARED};
    }

    public function create(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::SavedQueriesCreate);
    }

    public function update(Authenticatable $user, SearchSavedQuery $query): bool
    {
        return $this->has($user, SearchPermission::SavedQueriesUpdate)
            && $this->isOwn($user, $query);
    }

    public function share(Authenticatable $user, SearchSavedQuery $query): bool
    {
        return $this->has($user, SearchPermission::SavedQueriesShare)
            && $this->isOwn($user, $query);
    }

    public function delete(Authenticatable $user, SearchSavedQuery $query): bool
    {
        return $this->has($user, SearchPermission::SavedQueriesDelete)
            && $this->isOwn($user, $query);
    }

    public function run(Authenticatable $user, SearchSavedQuery $query): bool
    {
        return $this->view($user, $query);
    }

    private function has(Authenticatable $user, SearchPermission $permission): bool
    {
        return $user instanceof User && $user->can($permission->value);
    }

    private function isOwn(Authenticatable $user, SearchSavedQuery $query): bool
    {
        return (string) $query->{SearchSavedQueryInterface::ATTR_OWNER_ID}
            === (string) $user->getAuthIdentifier();
    }
}
