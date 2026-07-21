<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a lookup expects a subscription row but none is
 * visible — either the row doesn't exist, was soft-deleted, or
 * belongs to a different tenant (returned as 404 to avoid
 * cross-tenant enumeration attacks).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionNotFoundException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.not_found';
}
