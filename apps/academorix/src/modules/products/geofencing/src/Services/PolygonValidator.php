<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Services;

use Stackra\Geofencing\Contracts\Services\PolygonEvaluatorInterface;
use Stackra\Geofencing\Contracts\Services\PolygonValidatorInterface;
use Stackra\Geofencing\Enums\PolygonValidationReason;
use Stackra\Geofencing\Exceptions\InvalidPolygonException;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default polygon validator.
 *
 * Runs the closed / vertex-count / diameter / coordinate-range checks. The
 * self-intersection check is deliberately absent from this default — it's
 * expensive (O(n^2) segment-segment intersection tests) and rarely triggered
 * because tenant admins draw fences on a map UI that visualises overlaps.
 * Consumer apps that need strict self-intersection detection swap in their
 * own validator via `#[Bind]`.
 *
 * `#[Singleton]` — stateless.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Singleton]
final class PolygonValidator implements PolygonValidatorInterface
{
    public function __construct(
        private readonly PolygonEvaluatorInterface $evaluator,
        #[Config('geofencing.evaluator.max_polygon_diameter_m')] private readonly int $maxDiameterM,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function validate(array $vertices): void
    {
        $count = \count($vertices);

        // Vertex count check — polygon must have at least 4 points (3
        // unique + repeated first).
        if ($count < 4) {
            throw new InvalidPolygonException(PolygonValidationReason::TooFewVertices);
        }

        // Closure check — first + last vertex must be identical.
        $first = $vertices[0];
        $last  = $vertices[$count - 1];
        if ($first['lat'] !== $last['lat'] || $first['lng'] !== $last['lng']) {
            throw new InvalidPolygonException(PolygonValidationReason::NotClosed);
        }

        // Coordinate-range check — lat in [-90, 90], lng in [-180, 180].
        foreach ($vertices as $vertex) {
            if ($vertex['lat'] < -90 || $vertex['lat'] > 90) {
                throw new InvalidPolygonException(PolygonValidationReason::InvalidCoordinates);
            }
            if ($vertex['lng'] < -180 || $vertex['lng'] > 180) {
                throw new InvalidPolygonException(PolygonValidationReason::InvalidCoordinates);
            }
        }

        // Diameter check — reject polygons wider than the tangent-plane
        // approximation's validity zone.
        $maxDistance = 0.0;
        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $d = $this->evaluator->haversineDistanceM(
                    $vertices[$i]['lat'],
                    $vertices[$i]['lng'],
                    $vertices[$j]['lat'],
                    $vertices[$j]['lng'],
                );
                if ($d > $maxDistance) {
                    $maxDistance = $d;
                }
            }
        }

        if ($maxDistance > $this->maxDiameterM) {
            throw new InvalidPolygonException(PolygonValidationReason::TooLarge);
        }
    }
}
