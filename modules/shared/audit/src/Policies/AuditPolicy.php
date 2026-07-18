<?php

declare(strict_types=1);

namespace Academorix\Audit\Policies;

use Academorix\Audit\Contracts\Data\AuditInterface;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Models\Audit;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Dual-guard authorisation policy for {@see Audit}.
 *
 * ## Access model
 *
 *   - **Platform admins**  (guard `platform_admin`) — see + verify +
 *     export every audit row across every tenant. Cross-tenant reads
 *     are the whole point of this guard.
 *   - **Tenant DPO**       (guard `sanctum`, permission
 *     {@see AuditPermission::View}) — sees own-tenant rows only,
 *     including the platform-plane rows that ALSO touched their
 *     tenant (rare — those rows carry a non-NULL `tenant_id`).
 *   - **Every other user** — no access. Audit is compliance evidence,
 *     not general product data.
 *
 * ## Write actions
 *
 * There are no write actions. Audits are append-only via the
 * observer chain; `update` / `delete` / `restore` are absent by
 * design.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditPolicy
{
    /**
     * List — tenant DPO sees own tenant; platform admin sees all.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(AuditPermission::ViewAll->value)
            || $user->can(AuditPermission::View->value);
    }

    /**
     * Single row — tenant DPO scoped by tenant; platform admin
     * bypasses.
     */
    public function view(Authenticatable $user, Audit $audit): bool
    {
        if ($user->can(AuditPermission::ViewAll->value)) {
            return true;
        }

        if (! $user->can(AuditPermission::View->value)) {
            return false;
        }

        return $this->belongsToCaller($user, $audit);
    }

    /**
     * Trigger chain verification. Platform admin only.
     */
    public function verifyChain(Authenticatable $user): bool
    {
        return $user->can(AuditPermission::VerifyChain->value);
    }

    /**
     * Export audit rows for DSAR. Platform admin only.
     */
    public function exportDsar(Authenticatable $user): bool
    {
        return $user->can(AuditPermission::ExportDsar->value);
    }

    /**
     * Tenant scoping helper — returns true when the caller's tenant
     * matches the audit row's `tenant_id`. Platform-plane rows
     * (tenant_id NULL) are always OFF-LIMITS to tenant DPOs; those
     * rows describe cross-tenant operations that no single tenant
     * has a right to see.
     */
    private function belongsToCaller(Authenticatable $user, Audit $audit): bool
    {
        $rowTenantId = $audit->{AuditInterface::ATTR_TENANT_ID};
        if (! \is_string($rowTenantId) || $rowTenantId === '') {
            return false;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId) && $callerTenantId === $rowTenantId;
    }
}
