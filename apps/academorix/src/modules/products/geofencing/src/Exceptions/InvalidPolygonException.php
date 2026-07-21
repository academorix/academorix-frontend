<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Exceptions;

use Stackra\Exceptions\StackraException;
use Academorix\Geofencing\Enums\PolygonValidationReason;

/**
 * Raised by {@see \Academorix\Geofencing\Services\PolygonValidator} when a
 * submitted polygon fails validation.
 *
 * Carries the specific {@see PolygonValidationReason} so the caller can point
 * at the exact violation.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class InvalidPolygonException extends StackraException
{
    public const string CODE = 'geofencing.polygon_invalid';

    public const string TRANSLATION_KEY = 'geofencing::errors.polygon_invalid';

    public function __construct(
        public readonly PolygonValidationReason $reason,
        string $message = '',
    ) {
        parent::__construct(
            $message !== '' ? $message : \sprintf('Invalid polygon: %s', $reason->value),
        );
    }
}
