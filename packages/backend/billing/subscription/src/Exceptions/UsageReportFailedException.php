<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when `reportUsage()` fails against Stripe / Paddle.
 * Financial-material — HTTP 500 with retryable=true; ops receives
 * an alert when retries are exhausted.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class UsageReportFailedException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.usage_report_failed';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.usage_report_failed';
}
