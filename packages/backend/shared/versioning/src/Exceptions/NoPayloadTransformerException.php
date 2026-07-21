<?php

declare(strict_types=1);

namespace Stackra\Versioning\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the payload transformer registry has no chain from `$from`
 * to `$to` for the requested `(surface, event)`.
 *
 * Webhook delivery fails and the affected subscription is
 * auto-paused for admin review. REST callers see HTTP 500 with the
 * machine-readable code `versioning.no_transformer`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class NoPayloadTransformerException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'versioning.no_transformer';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'versioning::errors.no_transformer';
}
