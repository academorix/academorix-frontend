<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised on subscription creation when the requested plan belongs to
 * a different Application than the tenant. HTTP 422 — the client
 * picked a plan they cannot subscribe to.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanNotAvailableForApplicationException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.plan_not_available';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.plan_not_available';
}
