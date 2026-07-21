<?php

declare(strict_types=1);

namespace Stackra\Activity\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a lookup expects an activity row but none is visible —
 * either the row doesn't exist, was pruned past retention, or belongs
 * to a different tenant (returned as 404 rather than 403 to avoid
 * cross-tenant enumeration attacks).
 *
 * @category Activity
 *
 * @since    0.1.0
 */
final class ActivityNotFoundException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'activity.not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'activity::errors.not_found';
}
