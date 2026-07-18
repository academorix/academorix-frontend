<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Registry-level classification of a feature flag.
 *
 * ## Cases
 *
 *  * {@see self::KillSwitch} — emergency shut-off; platform-scoped rows in `feature_kill_switches`.
 *  * {@see self::Override}   — explicit allow/deny per subject.
 *  * {@see self::Rollout}    — percentage-based enablement.
 *  * {@see self::PlanGate}   — tied to a tenant-subscription entitlement.
 *
 * Not the same as the resolver's deciding source — a flag with
 * `kind = PlanGate` can still be decided by the `KillSwitch` layer
 * in a particular evaluation. Admin surfaces group flags by this
 * kind. Backed by strings so JSON payloads round-trip cleanly.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum FlagKind: string
{
    use Enum;

    /**
     * Emergency shut-off — platform-wide row that wins over every other layer.
     */
    #[Label('Kill Switch')]
    #[Description('Emergency shut-off row that wins over every other resolver layer.')]
    case KillSwitch = 'kill_switch';

    /**
     * Explicit allow/deny targeting a specific subject.
     */
    #[Label('Override')]
    #[Description('Explicit allow/deny row targeting a specific subject.')]
    case Override = 'override';

    /**
     * Percentage-based enablement over a subject population.
     */
    #[Label('Rollout')]
    #[Description('Percentage-based enablement over a subject population.')]
    case Rollout = 'rollout';

    /**
     * Enabled when the tenant's subscription grants a matching entitlement.
     */
    #[Label('Plan Gate')]
    #[Description('Enabled when the tenant subscription grants the matching entitlement.')]
    case PlanGate = 'plan_gate';
}
