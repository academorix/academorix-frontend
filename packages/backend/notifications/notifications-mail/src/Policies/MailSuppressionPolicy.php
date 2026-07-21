<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Policies;

use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Enums\MailSuppressionReason;
use Stackra\Notifications\Mail\Enums\NotificationsMailPermission;
use Stackra\Notifications\Mail\Models\MailSuppression;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see MailSuppression}.
 *
 * `viewAny` / `view` / `create` gate on the module's own
 * permissions. `delete` layers on TWO extra guards on top of the
 * permission:
 *
 *   1. `is_system=true` rows can NEVER be deleted through this
 *      surface. Only a super_admin using a seeder-context
 *      mutation-allowed scope can touch them.
 *   2. Hard-bounce / complaint / spam-trap rows are refused unless
 *      the caller passes `--force` + is a super_admin. The
 *      `--force` flag is a command-only concern; the HTTP surface
 *      always refuses these reasons.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailSuppressionPolicy
{
    /**
     * `viewAny` — list suppressions in the tenant.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsMailPermission::SuppressionsViewAny->value);
    }

    /**
     * `view` — read a single row.
     *
     * A tenant caller can only view a row belonging to their tenant
     * (or a platform-wide row that already applies to them via the
     * global scope).
     */
    public function view(Authenticatable $user, MailSuppression $row): bool
    {
        if (! $user->can(NotificationsMailPermission::SuppressionsView->value)) {
            return false;
        }

        return $this->callerTenantMatches($user, $row);
    }

    /**
     * `create` — add a suppression manually.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(NotificationsMailPermission::SuppressionsCreate->value);
    }

    /**
     * `delete` — revoke a suppression.
     *
     * The two guards above apply here: is_system rows are refused
     * outright; hard_bounce / complaint / spam_trap rows are
     * refused unless super_admin (handled at the command / route
     * boundary via a `--force` flag; the HTTP policy always refuses
     * them from tenant admin users).
     */
    public function delete(Authenticatable $user, MailSuppression $row): bool
    {
        if (! $user->can(NotificationsMailPermission::SuppressionsDelete->value)) {
            return false;
        }

        if (! $this->callerTenantMatches($user, $row)) {
            return false;
        }

        if ((bool) $row->{MailSuppressionInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        $reasonRaw = $row->{MailSuppressionInterface::ATTR_REASON};
        $reason = \is_object($reasonRaw) && \property_exists($reasonRaw, 'value')
            ? (string) $reasonRaw->value
            : (string) $reasonRaw;

        $protected = [
            MailSuppressionReason::HardBounce->value,
            MailSuppressionReason::Complaint->value,
            MailSuppressionReason::SpamTrap->value,
        ];

        return ! \in_array($reason, $protected, true);
    }

    /**
     * Ownership check — caller must be in the same tenant, OR the
     * row is platform-wide (`tenant_id NULL`, which every tenant
     * caller can observe via the global scope).
     */
    private function callerTenantMatches(Authenticatable $user, MailSuppression $row): bool
    {
        $rowTenantId = $row->{MailSuppressionInterface::ATTR_TENANT_ID} ?? null;

        if ($rowTenantId === null) {
            // Platform-wide rows are visible to every tenant caller
            // for read; writes are refused separately by
            // `is_system=true`.
            return true;
        }

        $userTenantId = $user->getAttribute('tenant_id');

        return $userTenantId !== null
            && (string) $rowTenantId === (string) $userTenantId;
    }
}
