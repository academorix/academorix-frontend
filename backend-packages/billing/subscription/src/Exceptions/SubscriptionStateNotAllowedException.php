<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised by the `subscription.state:...` middleware when the
 * tenant's subscription is not in the allow-list. HTTP 402 —
 * upgrade / renew to proceed.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionStateNotAllowedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.state_not_allowed';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.state_not_allowed';
}
