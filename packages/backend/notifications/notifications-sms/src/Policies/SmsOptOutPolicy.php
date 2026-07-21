<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Policies;

use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Enums\NotificationsSmsPermission;
use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see SmsOptOut}.
 *
 * Tenant admins CRUD their tenant's rows. STOP-keyword rows carry an
 * additional guard — even with the delete permission, revoking one requires
 * the observer's re-consent evidence flag (see the observer for the exact
 * gate).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsOptOutPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsSmsPermission::OptOutsViewAny->value);
    }

    public function view(Authenticatable $user, SmsOptOut $optOut): bool
    {
        return $user->can(NotificationsSmsPermission::OptOutsView->value)
            && $this->belongsToCaller($user, $optOut);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(NotificationsSmsPermission::OptOutsCreate->value);
    }

    public function delete(Authenticatable $user, SmsOptOut $optOut): bool
    {
        if (! $user->can(NotificationsSmsPermission::OptOutsDelete->value)) {
            return false;
        }

        // System rows and STOP-keyword rows require an additional
        // super_admin gate. The exact re-consent evidence check lives on the
        // observer; the policy simply gates who's even allowed to try.
        $reason = $optOut->{SmsOptOutInterface::ATTR_REASON};
        $reasonValue = $reason instanceof SmsOptOutReason
            ? $reason
            : SmsOptOutReason::tryFrom((string) $reason);

        if ($reasonValue === SmsOptOutReason::StopKeyword) {
            return $this->hasSuperAdmin($user);
        }

        if ((bool) $optOut->{SmsOptOutInterface::ATTR_IS_SYSTEM} === true) {
            return $this->hasSuperAdmin($user);
        }

        return $this->belongsToCaller($user, $optOut);
    }

    /**
     * A row with `tenant_id = NULL` is a platform-wide row — regular tenant
     * admins can neither read nor write it. Rows with a tenant_id must match
     * the caller's tenant.
     */
    private function belongsToCaller(Authenticatable $user, SmsOptOut $optOut): bool
    {
        $rowTenantId = $optOut->{SmsOptOutInterface::ATTR_TENANT_ID};
        if ($rowTenantId === null) {
            return $this->hasSuperAdmin($user);
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId) && $callerTenantId === (string) $rowTenantId;
    }

    /**
     * Whether the caller carries the platform super_admin role. Reads via
     * spatie's `hasRole()` when present on the authenticatable — falls back
     * to `false` when the role subsystem isn't installed on this guard.
     */
    private function hasSuperAdmin(Authenticatable $user): bool
    {
        if (\method_exists($user, 'hasRole')) {
            /** @var mixed $result */
            $result = $user->hasRole('super_admin');

            return (bool) $result;
        }

        return false;
    }
}
