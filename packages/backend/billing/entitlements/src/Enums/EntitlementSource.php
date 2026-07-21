<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Origin of an entitlement value.
 *
 * ## Cases
 *
 *  * {@see self::Plan}     — sourced from the tenant's active
 *    subscription plan. Upserted by `SyncEntitlementsFromPlanJob`.
 *  * {@see self::Override} — set manually by a platform admin (typical
 *    for enterprise contract negotiations). Never overwritten by the
 *    plan syncer.
 *  * {@see self::System}   — platform-defaulted (fallback when a plan
 *    has no explicit value for a declared key).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum EntitlementSource: string
{
    use Enum;

    /**
     * Sourced from the tenant's active plan.
     */
    #[Label('Plan')]
    #[Description('Value sourced from the tenant\'s active subscription plan. Upserted by SyncEntitlementsFromPlanJob.')]
    case Plan = 'plan';

    /**
     * Manual override — platform admin negotiated cap.
     */
    #[Label('Override')]
    #[Description('Set manually by a platform admin. Never overwritten by the plan syncer.')]
    case Override = 'override';

    /**
     * Platform-defaulted fallback.
     */
    #[Label('System')]
    #[Description('Platform-defaulted fallback — used when the plan has no explicit value for a declared key.')]
    case System = 'system';
}
