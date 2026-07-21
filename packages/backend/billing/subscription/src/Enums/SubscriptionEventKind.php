<?php

declare(strict_types=1);

namespace Stackra\Subscription\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Kind of lifecycle transition recorded on a
 * {@see \Stackra\Subscription\Models\SubscriptionEvent} row.
 *
 * ## Cases
 *
 *   - {@see self::Started}          — new subscription persisted.
 *   - {@see self::Activated}        — state → active.
 *   - {@see self::Upgraded}         — plan swap to higher tier.
 *   - {@see self::Downgraded}       — plan swap to lower tier.
 *   - {@see self::Switched}         — plan swap within same tier.
 *   - {@see self::Cancelled}        — cancel_at_period_end or immediate.
 *   - {@see self::Reinstated}       — cancel reversed within grace.
 *   - {@see self::Renewed}          — successful renewal payment.
 *   - {@see self::PastDue}          — Cashier flagged past_due.
 *   - {@see self::Unpaid}           — grace expired.
 *   - {@see self::Suspended}        — full suspension.
 *   - {@see self::TrialStarted}     — trial began.
 *   - {@see self::TrialEnding}      — trial ending warning fired.
 *   - {@see self::TrialEnded}       — trial reached its boundary.
 *   - {@see self::PaymentSucceeded} — Cashier invoice.payment_succeeded.
 *   - {@see self::PaymentFailed}    — Cashier invoice.payment_failed.
 *   - {@see self::UsageReported}    — metered usage exported to provider.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubscriptionEventKind: string
{
    use Enum;

    #[Label('Started')]
    #[Description('New subscription persisted (tenant signup or first plan selection).')]
    case Started = 'started';

    #[Label('Activated')]
    #[Description('State transitioned to active (from trialing or from grace after payment).')]
    case Activated = 'activated';

    #[Label('Upgraded')]
    #[Description('Plan swap to a higher tier.')]
    case Upgraded = 'upgraded';

    #[Label('Downgraded')]
    #[Description('Plan swap to a lower tier.')]
    case Downgraded = 'downgraded';

    #[Label('Switched')]
    #[Description('Plan swap within the same tier (e.g. monthly to annual).')]
    case Switched = 'switched';

    #[Label('Cancelled')]
    #[Description('Cancellation deferred to period end or immediate.')]
    case Cancelled = 'cancelled';

    #[Label('Reinstated')]
    #[Description('Pending cancellation reversed within grace.')]
    case Reinstated = 'reinstated';

    #[Label('Renewed')]
    #[Description('Renewal payment succeeded.')]
    case Renewed = 'renewed';

    #[Label('Past Due')]
    #[Description('First payment failure — Cashier flagged past_due.')]
    case PastDue = 'past_due';

    #[Label('Unpaid')]
    #[Description('Grace expired — Cashier flagged unpaid.')]
    case Unpaid = 'unpaid';

    #[Label('Suspended')]
    #[Description('Full tenant suspension after grace exhausted.')]
    case Suspended = 'suspended';

    #[Label('Trial Started')]
    #[Description('Trial subscription began.')]
    case TrialStarted = 'trial_started';

    #[Label('Trial Ending')]
    #[Description('Trial ending warning fired ahead of trial_ends_at.')]
    case TrialEnding = 'trial_ending';

    #[Label('Trial Ended')]
    #[Description('Trial reached its boundary.')]
    case TrialEnded = 'trial_ended';

    #[Label('Payment Succeeded')]
    #[Description('Cashier invoice.payment_succeeded webhook processed.')]
    case PaymentSucceeded = 'payment_succeeded';

    #[Label('Payment Failed')]
    #[Description('Cashier invoice.payment_failed webhook processed.')]
    case PaymentFailed = 'payment_failed';

    #[Label('Usage Reported')]
    #[Description('Metered usage exported to the payment provider.')]
    case UsageReported = 'usage_reported';
}
