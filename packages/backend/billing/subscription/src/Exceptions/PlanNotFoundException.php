<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a plan lookup returns nothing — either the id is
 * wrong, the plan has been archived, or the plan belongs to a
 * different Application than the caller's tenant.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanNotFoundException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.plan_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.plan_not_found';
}
