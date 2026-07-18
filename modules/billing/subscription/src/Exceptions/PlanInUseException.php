<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a platform admin tries to delete a plan while active
 * subscriptions still reference it. HTTP 409 — the subscription
 * observer refuses to leave orphan rows.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanInUseException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.plan_in_use';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.plan_in_use';

    /**
     * Convenience factory used by the observer + policy raise path.
     */
    public static function forPlan(string $planId, int $activeCount): self
    {
        return (new self(\sprintf(
            'Plan "%s" cannot be removed while %d active subscription(s) reference it.',
            $planId,
            $activeCount,
        )));
    }
}
