<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Compliance module contributes.
 *
 * Split across the two guards — tenant users read their own DSARs +
 * consent records + safeguarding incidents via `sanctum`; platform
 * staff manage the platform-wide surface (subprocessor registry,
 * legal-hold policy, breach dashboard) via `platform_admin`.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum CompliancePermission: string implements PermissionEnum
{
    use Enum;

    // ── Tenant-scoped (sanctum) ────────────────────────────────

    /**
     * `compliance.dsar.request` — tenant user files a DSAR against
     * their own subject data.
     */
    #[Label('Request DSAR')]
    #[Description('File a data-subject request against your own data.')]
    case DsarRequest = 'compliance.dsar.request';

    /**
     * `compliance.dsar.view` — tenant user reads their own DSAR
     * lifecycle.
     */
    #[Label('View Own DSARs')]
    #[Description('Read the status of DSARs you have filed.')]
    case DsarView = 'compliance.dsar.view';

    /**
     * `compliance.consent.manage` — tenant user grants or withdraws
     * their own consent decisions.
     */
    #[Label('Manage Own Consent')]
    #[Description('Grant or withdraw your own consent decisions.')]
    case ConsentManage = 'compliance.consent.manage';

    /**
     * `compliance.consent.view` — tenant user reads their consent
     * history.
     */
    #[Label('View Own Consent')]
    #[Description('Read your consent history.')]
    case ConsentView = 'compliance.consent.view';

    /**
     * `compliance.safeguarding.report` — tenant user files a
     * safeguarding concern.
     */
    #[Label('Report Safeguarding Concern')]
    #[Description('File a safeguarding incident report.')]
    case SafeguardingReport = 'compliance.safeguarding.report';

    /**
     * `compliance.safeguarding.view` — tenant user reads their
     * own filed safeguarding incidents.
     */
    #[Label('View Own Safeguarding Reports')]
    #[Description('Read the safeguarding incidents you have filed.')]
    case SafeguardingView = 'compliance.safeguarding.view';

    // ── Platform-scoped (platform_admin) ───────────────────────

    /**
     * `compliance.platform.dsars.viewAny` — platform ops list every
     * DSAR cross-tenant.
     */
    #[Label('View All DSARs (platform)')]
    #[Description('Cross-tenant read-only access to every DSAR.')]
    case PlatformDsarsViewAny = 'compliance.platform.dsars.viewAny';

    /**
     * `compliance.platform.dsars.manage` — platform ops triage +
     * approve + deliver DSARs.
     */
    #[Label('Manage DSARs (platform)')]
    #[Description('Triage, approve, deliver, and reject DSARs cross-tenant.')]
    case PlatformDsarsManage = 'compliance.platform.dsars.manage';

    /**
     * `compliance.platform.consent.manage` — platform ops manage
     * consent category catalogue.
     */
    #[Label('Manage Consent Catalogue')]
    #[Description('Add, update, and remove consent categories.')]
    case PlatformConsentManage = 'compliance.platform.consent.manage';

    /**
     * `compliance.platform.legal_holds.viewAny` — platform ops list
     * every legal hold.
     */
    #[Label('View Legal Holds (platform)')]
    #[Description('Cross-tenant read-only access to every legal hold.')]
    case PlatformLegalHoldsViewAny = 'compliance.platform.legal_holds.viewAny';

    /**
     * `compliance.platform.legal_holds.manage` — platform ops apply +
     * release legal holds.
     */
    #[Label('Manage Legal Holds')]
    #[Description('Apply, update, and release legal holds. Every action audited.')]
    case PlatformLegalHoldsManage = 'compliance.platform.legal_holds.manage';

    /**
     * `compliance.platform.subprocessors.manage` — platform ops
     * manage the subprocessor registry.
     */
    #[Label('Manage Subprocessors')]
    #[Description('Add, update, and remove subprocessors from the VPC registry.')]
    case PlatformSubprocessorsManage = 'compliance.platform.subprocessors.manage';

    /**
     * `compliance.platform.retention.viewAny` — platform ops list
     * every retention run.
     */
    #[Label('View Retention Runs')]
    #[Description('Cross-tenant read-only access to every retention sweep audit row.')]
    case PlatformRetentionViewAny = 'compliance.platform.retention.viewAny';

    /**
     * `compliance.platform.retention.dispatch` — platform ops
     * trigger manual retention sweeps.
     */
    #[Label('Dispatch Retention Sweep')]
    #[Description('Trigger a manual retention sweep for one or more tenants.')]
    case PlatformRetentionDispatch = 'compliance.platform.retention.dispatch';

    /**
     * `compliance.platform.safeguarding.manage` — platform ops
     * escalate + close safeguarding incidents.
     */
    #[Label('Manage Safeguarding Incidents')]
    #[Description('Escalate, investigate, and close safeguarding incidents cross-tenant.')]
    case PlatformSafeguardingManage = 'compliance.platform.safeguarding.manage';

    /**
     * `compliance.platform.breach.manage` — platform ops create +
     * approve breach notifications.
     */
    #[Label('Manage Breach Notifications')]
    #[Description('Create, review, and approve breach notifications. Every action audited.')]
    case PlatformBreachManage = 'compliance.platform.breach.manage';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::DsarRequest,
            self::DsarView,
            self::ConsentManage,
            self::ConsentView,
            self::SafeguardingReport,
            self::SafeguardingView => Guard::Sanctum,

            self::PlatformDsarsViewAny,
            self::PlatformDsarsManage,
            self::PlatformConsentManage,
            self::PlatformLegalHoldsViewAny,
            self::PlatformLegalHoldsManage,
            self::PlatformSubprocessorsManage,
            self::PlatformRetentionViewAny,
            self::PlatformRetentionDispatch,
            self::PlatformSafeguardingManage,
            self::PlatformBreachManage => Guard::PlatformAdmin,
        };
    }
}
