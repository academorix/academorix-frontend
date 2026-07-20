<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Policies;

use Academorix\Tenancy\Contracts\Data\TenantContactInterface;
use Academorix\Tenancy\Contracts\Repositories\TenantContactRepositoryInterface;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Enums\TenantContactKind;
use Academorix\Tenancy\Models\TenantContact;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see TenantContact}.
 *
 * Dual-guard — platform admins with `tenancy.tenant.manage` OR tenant
 * admins with `tenancy.contact.manage`. Refuses deletion of the last
 * DPO contact for a GDPR-subject tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantContactPolicy
{
    public function __construct(
        private readonly TenantContactRepositoryInterface $contacts,
    ) {
    }

    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(TenancyPermission::Manage->value)
            || $user->can(TenancyPermission::ManageContacts->value);
    }

    public function view(Authenticatable $user, TenantContact $contact): bool
    {
        return $this->viewAny($user);
    }

    public function create(Authenticatable $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(Authenticatable $user, TenantContact $contact): bool
    {
        return $this->viewAny($user);
    }

    /**
     * `delete` — refuses when the target is the LAST remaining DPO
     * contact for the tenant. GDPR Art. 30 requires the ROPA to
     * retain a DPO contact.
     */
    public function delete(Authenticatable $user, TenantContact $contact): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        $kind = $contact->{TenantContactInterface::ATTR_KIND};
        if ($kind === TenantContactKind::Dpo) {
            $remaining = $this->contacts->findByKind(
                (string) $contact->{TenantContactInterface::ATTR_TENANT_ID},
                TenantContactKind::Dpo,
            )->reject(fn (TenantContact $c) => $c->getKey() === $contact->getKey());

            if ($remaining->isEmpty()) {
                return false;
            }
        }

        return true;
    }
}
