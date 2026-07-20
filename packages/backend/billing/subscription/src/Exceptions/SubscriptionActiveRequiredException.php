<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised by `subscription.active` middleware when the tenant's
 * subscription is in a restrictive state (grace / suspended /
 * cancelled). HTTP 402 — payment required — with the current state
 * + upgrade path in the response context.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionActiveRequiredException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.active_required';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.active_required';

    /**
     * Convenience factory used by the middleware's raise path.
     */
    public static function forState(string $tenantId, string $currentState): self
    {
        return (new self(\sprintf(
            'Active subscription required — tenant %s is in state "%s".',
            $tenantId,
            $currentState,
        )));
    }
}
