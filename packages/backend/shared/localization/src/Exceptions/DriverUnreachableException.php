<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a translator driver fails a network round-trip. The
 * job's retry chain catches this and re-tries per its
 * `#[Backoff]` schedule; after exhaustion the failure bubbles up to
 * the `MachineTranslationFailed` event.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class DriverUnreachableException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.driver_unreachable';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.driver_unreachable';
}
