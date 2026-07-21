<?php

declare(strict_types=1);

namespace Stackra\Audit\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Audit module contributes.
 *
 * ## Cases
 *
 *  * {@see self::View}         — tenant DPO reads own-tenant audit rows.
 *    Restricted-tier fields still masked as `[REDACTED]` unless the
 *    caller also holds `audit.view-restricted` (a separate spatie
 *    permission gated by the tenant DPO role, out of enum scope).
 *  * {@see self::ViewAll}      — platform admin reads every tenant's
 *    audit rows. Full field access for compliance investigations.
 *  * {@see self::VerifyChain}  — platform admin triggers a chain-
 *    verification job for one tenant or every tenant.
 *  * {@see self::ExportDsar}   — platform admin exports audit rows for
 *    a specific `user_id` across a date window (DSAR / GDPR Art. 15).
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum AuditPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('View Own-Tenant Audits')]
    #[Description('Tenant DPO can list + read audit rows for own tenant. Sensitive fields masked.')]
    case View = 'audit.audit.view';

    #[Label('View Every Audit (platform)')]
    #[Description('Platform admin sees every audit row across every tenant. Full field access.')]
    case ViewAll = 'audit.audit.view_all';

    #[Label('Verify Audit Chain')]
    #[Description('Trigger the tamper-evident chain-verification job. Platform admin only.')]
    case VerifyChain = 'audit.audit.verify_chain';

    #[Label('Export Audit for DSAR')]
    #[Description('Export audit rows referencing a specific subject for DSAR compliance. Highest sensitivity.')]
    case ExportDsar = 'audit.audit.export_dsar';

    /**
     * Return the auth guard this permission attaches to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View                                        => Guard::Sanctum,
            self::ViewAll, self::VerifyChain, self::ExportDsar => Guard::PlatformAdmin,
        };
    }
}
