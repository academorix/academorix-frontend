<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Contracts\Services;

use Academorix\Geofencing\Services\PolygonEvaluator;
use Illuminate\Container\Attributes\Bind;

/**
 * Polygon geometry math seam.
 *
 * The default implementation delegates to `spinen/laravel-geometry` when the
 * geoPHP classmap is loaded; falls back to a hand-rolled ray-cast +
 * haversine when it isn't (typical in tests).
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(PolygonEvaluator::class)]
interface PolygonEvaluatorInterface
{
    /**
     * Whether the given point lies inside the polygon.
     *
     * @param  list<array{lat: float, lng: float}>  $polygonVertices
     */
    public function isPointInPolygon(float $lat, float $lng, array $polygonVertices): bool;

    /**
     * Distance in meters from the point to the polygon edge (0 when inside).
     *
     * @param  list<array{lat: float, lng: float}>  $polygonVertices
     */
    public function distanceToPolygonM(float $lat, float $lng, array $polygonVertices): float;

    /**
     * Haversine distance between two points in meters.
     */
    public function haversineDistanceM(float $lat1, float $lng1, float $lat2, float $lng2): float;
}
