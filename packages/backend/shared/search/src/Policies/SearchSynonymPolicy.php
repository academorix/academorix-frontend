<?php

declare(strict_types=1);

namespace Stackra\Search\Policies;

use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSynonym;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see SearchSynonym}.
 *
 * System-seeded rows (`is_system = true`) can be disabled by tenant
 * admins but never deleted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::SynonymsViewAny);
    }

    public function view(Authenticatable $user, SearchSynonym $synonym): bool
    {
        unset($synonym);

        return $this->has($user, SearchPermission::SynonymsView);
    }

    public function create(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::SynonymsCreate);
    }

    /**
     * `update` — cannot update a system row.
     */
    public function update(Authenticatable $user, SearchSynonym $synonym): bool
    {
        if ((bool) $synonym->{SearchSynonymInterface::ATTR_IS_SYSTEM}) {
            return false;
        }

        return $this->has($user, SearchPermission::SynonymsUpdate);
    }

    /**
     * `delete` — cannot delete a system row.
     */
    public function delete(Authenticatable $user, SearchSynonym $synonym): bool
    {
        if ((bool) $synonym->{SearchSynonymInterface::ATTR_IS_SYSTEM}) {
            return false;
        }

        return $this->has($user, SearchPermission::SynonymsDelete);
    }

    /**
     * `disable` — flip `is_active = false`. Allowed on system rows so
     * tenants can opt out of platform-seeded synonyms.
     */
    public function disable(Authenticatable $user, SearchSynonym $synonym): bool
    {
        unset($synonym);

        return $this->has($user, SearchPermission::SynonymsUpdate);
    }

    private function has(Authenticatable $user, SearchPermission $permission): bool
    {
        return $user instanceof User && $user->can($permission->value);
    }
}
