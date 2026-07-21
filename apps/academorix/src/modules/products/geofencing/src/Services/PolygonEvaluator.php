<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Services;

use Academorix\Geofencing\Contracts\Services\PolygonEvaluatorInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Hand-rolled polygon math implementation.
 *
 * Deliberately does NOT depend on the geoPHP / Magellan classmap so the
 * module boots + tests without the optional peer dependencies. Consumer apps
 * that install `spinen/laravel-geometry` can swap in a Spinen-backed
 * concrete via `#[Bind]` on {@see PolygonEvaluatorInterface}.
 *
 * ## Algorithms
 *
 *   - **Point-in-polygon**: ray-cast — count how many polygon edges a
 *     horizontal ray from the point crosses. Odd = inside, even = outside.
 *     O(n) in the number of vertices.
 *   - **Distance-to-polygon**: minimum haversine distance from the point to
 *     any polygon edge. When inside, returns 0.
 *   - **Haversine**: great-circle distance in meters on a spherical earth
 *     with radius 6,371,000m. Accurate to within a few meters for the
 *     tangent-plane distances (< 10km) this module operates in.
 *
 * `#[Singleton]` — stateless.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Singleton]
final class PolygonEvaluator implements PolygonEvaluatorInterface
{
    /**
     * Earth radius in meters (WGS84 mean).
     */
    private const float EARTH_RADIUS_M = 6_371_000.0;

    /**
     * {@inheritDoc}
     */
    public function isPointInPolygon(float $lat, float $lng, array $polygonVertices): bool
    {
        $count = \count($polygonVertices);
        if ($count < 3) {
            return false;
        }

        // Ray-cast. Toggle `inside` every time the ray from ($lng, $lat) to
        // the east crosses a polygon edge.
        $inside = false;
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $polygonVertices[$i]['lng'];
            $yi = $polygonVertices[$i]['lat'];
            $xj = $polygonVertices[$j]['lng'];
            $yj = $polygonVertices[$j]['lat'];

            $intersect = (($yi > $lat) !== ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1e-12) + $xi);
            if ($intersect) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * {@inheritDoc}
     */
    public function distanceToPolygonM(float $lat, float $lng, array $polygonVertices): float
    {
        if ($this->isPointInPolygon($lat, $lng, $polygonVertices)) {
            return 0.0;
        }

        $count = \count($polygonVertices);
        if ($count < 2) {
            return \PHP_FLOAT_MAX;
        }

        $min = \PHP_FLOAT_MAX;
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $d = $this->distancePointToSegmentM(
                $lat,
                $lng,
                $polygonVertices[$j]['lat'],
                $polygonVertices[$j]['lng'],
                $polygonVertices[$i]['lat'],
                $polygonVertices[$i]['lng'],
            );

            if ($d < $min) {
                $min = $d;
            }
        }

        return $min;
    }

    /**
     * {@inheritDoc}
     */
    public function haversineDistanceM(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $phi1 = \deg2rad($lat1);
        $phi2 = \deg2rad($lat2);
        $deltaPhi    = \deg2rad($lat2 - $lat1);
        $deltaLambda = \deg2rad($lng2 - $lng1);

        $a = \sin($deltaPhi / 2) ** 2
            + \cos($phi1) * \cos($phi2) * \sin($deltaLambda / 2) ** 2;
        $c = 2 * \atan2(\sqrt($a), \sqrt(1 - $a));

        return self::EARTH_RADIUS_M * $c;
    }

    /**
     * Distance from a point to a great-circle line segment, approximated in
     * the local tangent plane via projected haversine. Accurate within a
     * few meters at the ranges this module operates in (< 10 km fences).
     */
    private function distancePointToSegmentM(
        float $pLat,
        float $pLng,
        float $aLat,
        float $aLng,
        float $bLat,
        float $bLng,
    ): float {
        // Fast path — degenerate segment.
        if ($aLat === $bLat && $aLng === $bLng) {
            return $this->haversineDistanceM($pLat, $pLng, $aLat, $aLng);
        }

        // Project the three points into a local Cartesian frame at the
        // segment's midpoint. For sub-10km distances the loss of accuracy
        // from ignoring earth curvature is under a meter.
        $midLat = ($aLat + $bLat) / 2;
        $cosMid = \cos(\deg2rad($midLat));

        $ax = ($aLng) * $cosMid;
        $ay = $aLat;
        $bx = ($bLng) * $cosMid;
        $by = $bLat;
        $px = ($pLng) * $cosMid;
        $py = $pLat;

        // Parametric projection of P onto AB, clamped to [0, 1].
        $dx = $bx - $ax;
        $dy = $by - $ay;
        $lengthSquared = $dx * $dx + $dy * $dy;
        $t = $lengthSquared > 0
            ? \max(0.0, \min(1.0, (($px - $ax) * $dx + ($py - $ay) * $dy) / $lengthSquared))
            : 0.0;

        // Closest point on the segment.
        $cx = $ax + $t * $dx;
        $cy = $ay + $t * $dy;

        // Convert back to lat/lng.
        $closestLat = $cy;
        $closestLng = $cx / ($cosMid !== 0.0 ? $cosMid : 1.0);

        return $this->haversineDistanceM($pLat, $pLng, $closestLat, $closestLng);
    }
}
