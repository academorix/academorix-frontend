<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Contracts\Services;

use Academorix\Geofencing\Services\PolygonValidator;
use Illuminate\Container\Attributes\Bind;

/**
 * Polygon input validator.
 *
 * Runs the closed / vertex-count / self-intersection / diameter / coordinate
 * checks before persist. Consumers throw
 * {@see \Academorix\Geofencing\Exceptions\InvalidPolygonException} with the
 * specific reason on failure.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(PolygonValidator::class)]
interface PolygonValidatorInterface
{
    /**
     * Validate a polygon expressed as an array of vertices. Raises
     * {@see \Academorix\Geofencing\Exceptions\InvalidPolygonException} on
     * failure with the specific reason enum.
     *
     * @param  list<array{lat: float, lng: float}>  $vertices
     */
    public function validate(array $vertices): void;
}
