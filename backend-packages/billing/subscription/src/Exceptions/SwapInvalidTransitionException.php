<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a plan swap is refused because the target plan sits
 * outside the allowed transition graph (e.g. enterprise to free,
 * which must go through cancel + reinstate). HTTP 422.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SwapInvalidTransitionException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.swap_invalid_transition';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.swap_invalid_transition';
}
