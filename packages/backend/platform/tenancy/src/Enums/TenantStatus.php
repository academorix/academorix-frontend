<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle status of a Tenant.
 *
 * ## Cases
 *
 *  * {@see self::Trialing}  — freshly provisioned, in trial window (default 14 days).
 *  * {@see self::Active}    — paying + healthy. Full access.
 *  * {@see self::Suspended} — platform-admin action or billing failure. Read-only.
 *  * {@see self::Grace}     — payment past-due, grace period (default 7 days). Reads work; writes gated.
 *  * {@see self::Archived}  — soft-deleted, awaiting hard-delete after retention window (30 days).
 *  * {@see self::Inactive}  — long-inactive, dashboard-hidden but not archived. Manual re-activation.
 *
 * The status field is stored as a string on `tenants.status`. Any
 * transition is emitted as a dedicated lifecycle event
 * (`TenantSuspended`, `TenantResumed`, `TenantArchived`, `TenantErased`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TenantStatus: string
{
    use Enum;

    /**
     * Trial period — new tenant in first 14 days by default.
     */
    #[Label('Trialing')]
    #[Description('Freshly provisioned, in trial window. Trial ends at `trial_ends_at`; transitions to Active or Suspended.')]
    case Trialing = 'trialing';

    /**
     * Active — paying + healthy. Full read/write access.
     */
    #[Label('Active')]
    #[Description('Paying + healthy. Full access. The default state after trial.')]
    case Active = 'active';

    /**
     * Suspended — platform-admin or billing-driven suspension.
     */
    #[Label('Suspended')]
    #[Description('Platform-admin action or billing failure. Reads work; writes refuse with TENANCY_TENANT_SUSPENDED (403).')]
    case Suspended = 'suspended';

    /**
     * Grace — payment failed, awaiting resolution within grace window.
     */
    #[Label('Grace Period')]
    #[Description('Payment past-due, in the grace window. Reads work; writes gated. Auto-transitions to Suspended on grace_ends_at.')]
    case Grace = 'grace';

    /**
     * Archived — soft-deleted, awaiting hard-delete.
     */
    #[Label('Archived')]
    #[Description('Soft-deleted. Awaiting hard-delete after the 30-day retention window (HardDeleteArchivedTenantJob).')]
    case Archived = 'archived';

    /**
     * Inactive — long-idle tenant, dashboard-hidden.
     */
    #[Label('Inactive')]
    #[Description('Long-inactive, dashboard-hidden but not archived. Manual reactivation restores.')]
    case Inactive = 'inactive';
}
