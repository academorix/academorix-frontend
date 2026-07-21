<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Names the resolver layer that decided a particular flag evaluation.
 *
 * ## Cases
 *
 *  * {@see self::KillSwitch} — a matching kill-switch row shut the flag off.
 *  * {@see self::Override}   — an allow/deny row from `feature_overrides` decided it.
 *  * {@see self::Rollout}    — the deterministic bucket hash decided it.
 *  * {@see self::PlanGate}   — the tenant's plan entitlement decided it.
 *  * {@see self::Default}    — every earlier layer deferred; the class-default terminator ran.
 *
 * Carried verbatim on `FeatureResolution::$source` and on the
 * `context.source` field of `FeatureDisabledException`. Consumers
 * — most notably `RequireFeatureMiddleware` — branch on this to
 * map denials to HTTP 402 (`plan_gate`) vs 403 (everything else).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ResolutionSource: string
{
    use Enum;

    /**
     * A matching row on `feature_kill_switches` shut the flag off.
     */
    #[Label('Kill Switch')]
    #[Description('A matching kill-switch row shut the flag off.')]
    case KillSwitch = 'kill_switch';

    /**
     * An allow/deny row on `feature_overrides` decided the flag.
     */
    #[Label('Override')]
    #[Description('An explicit allow/deny row on feature_overrides decided the flag.')]
    case Override = 'override';

    /**
     * The deterministic percentage bucket decided the flag.
     */
    #[Label('Rollout')]
    #[Description('The deterministic percentage bucket decided the flag.')]
    case Rollout = 'rollout';

    /**
     * The tenant's plan entitlement decided the flag.
     */
    #[Label('Plan Gate')]
    #[Description('The tenant plan entitlement decided the flag.')]
    case PlanGate = 'plan_gate';

    /**
     * Every earlier layer deferred; the class-default terminator ran.
     */
    #[Label('Default')]
    #[Description('Every earlier layer deferred; the class-default terminator ran.')]
    case Default = 'default';
}
