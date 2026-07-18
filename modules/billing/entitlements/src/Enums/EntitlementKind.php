<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * How an entitlement is measured and enforced.
 *
 * ## Cases
 *
 *  * {@see self::Slot}      — hard cap on concurrent count. `value`
 *    carries `{limit, used}`. Consumption succeeds when
 *    `used + delta ≤ limit`; refunded on delete.
 *  * {@see self::Pool}      — periodic quota with reset. `value`
 *    carries `{limit, used}` and `period` names the reset window.
 *    `used` resets to `0` at the boundary.
 *  * {@see self::Boolean}   — feature toggle. `value` carries
 *    `{enabled: true|false}`. `consume()` is a straight
 *    `enabled === true` check.
 *  * {@see self::Unlimited} — enterprise sentinel. Every `consume()`
 *    succeeds. No usage rows are written.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum EntitlementKind: string
{
    use Enum;

    /**
     * Hard cap on concurrent count. Refunded on delete.
     */
    #[Label('Slot')]
    #[Description('Hard cap on a concurrent count. Consumption succeeds while used + delta ≤ limit; refunded on delete.')]
    case Slot = 'slot';

    /**
     * Periodic quota with reset (monthly / anniversary / lifetime).
     */
    #[Label('Pool')]
    #[Description('Periodic quota with reset. `used` returns to zero at the period boundary.')]
    case Pool = 'pool';

    /**
     * Feature toggle — value is `true` or `false`.
     */
    #[Label('Boolean')]
    #[Description('Feature toggle — `consume()` succeeds only when the toggle is enabled.')]
    case Boolean = 'boolean';

    /**
     * Enterprise sentinel — always succeeds; no usage recorded.
     */
    #[Label('Unlimited')]
    #[Description('Enterprise sentinel — every consumption succeeds; no usage rows are recorded.')]
    case Unlimited = 'unlimited';
}
