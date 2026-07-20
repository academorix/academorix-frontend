<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised on checkout / swap when the target plan has
 * `is_deprecated=true`. Existing subscriptions are grandfathered;
 * new signups refused with HTTP 422.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanDeprecatedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.plan_deprecated';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.plan_deprecated';
}
