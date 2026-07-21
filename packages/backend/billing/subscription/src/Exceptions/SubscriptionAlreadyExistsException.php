<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised on subscription creation when the tenant already has an
 * active (non-terminal) subscription. HTTP 409 conflict — the tenant
 * must cancel or wait for expiration before starting a new one.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionAlreadyExistsException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.already_exists';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.already_exists';
}
