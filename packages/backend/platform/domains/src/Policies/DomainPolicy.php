<?php

declare(strict_types=1);

namespace Stackra\Domains\Policies;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Domain}.
 *
 * Dual-guard — platform admins with `domains.domain.manage` OR tenant
 * admins with `domains.tenant.manage` scoped to their own tenant.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(DomainsPermission::View->value)
            || $user->can(DomainsPermission::Manage->value)
            || $user->can(DomainsPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, Domain $domain): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $domain);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(DomainsPermission::Manage->value)
            || $user->can(DomainsPermission::ManageOwn->value);
    }

    public function update(Authenticatable $user, Domain $domain): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $domain);
    }

    public function delete(Authenticatable $user, Domain $domain): bool
    {
        return $this->update($user, $domain);
    }

    /**
     * `verify` — trigger a manual re-verify from the tenant admin UI.
     */
    public function verify(Authenticatable $user, Domain $domain): bool
    {
        return $this->update($user, $domain);
    }

    /**
     * Tenant admins may only touch domains belonging to their own
     * tenant. Platform admins bypass the check.
     */
    private function belongsToCaller(Authenticatable $user, Domain $domain): bool
    {
        // Platform-admin permissions bypass the tenant match.
        if ($user->can(DomainsPermission::Manage->value) || $user->can(DomainsPermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $domain->{DomainInterface::ATTR_TENANT_ID};
    }
}
