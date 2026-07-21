<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a fenceable has neither a polygon nor a location point.
 *
 * Configuration bug — the fenceable exists but nobody drew the fence yet.
 * Fail-loud so the operator notices.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class FenceableNoGeometryException extends StackraException
{
    public const string CODE = 'geofencing.fenceable_no_geometry';

    public const string TRANSLATION_KEY = 'geofencing::errors.fenceable_no_geometry';
}
