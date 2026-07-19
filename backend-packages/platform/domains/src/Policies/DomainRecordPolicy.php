<?php

declare(strict_types=1);

namespace Academorix\Domains\Policies;

use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\DomainRecord;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see DomainRecord} — READ-ONLY surface.
 *
 * DomainRecord rows are populated by the observer + verifier job; no
 * direct create / update / delete path is exposed via HTTP.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainRecordPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(DomainsPermission::View->value)
            || $user->can(DomainsPermission::Manage->value)
            || $user->can(DomainsPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, DomainRecord $record): bool
    {
        return $this->viewAny($user);
    }
}
