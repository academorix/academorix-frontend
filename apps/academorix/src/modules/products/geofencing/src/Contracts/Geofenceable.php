<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Contracts;

/**
 * Stable surface every fenceable model implements.
 *
 * The evaluator depends on THIS interface, never on column reads directly,
 * so models with non-standard geometry storage (linked spatial_features
 * table, external service) can plug in by implementing the interface without
 * the trait.
 *
 * The default {@see \Stackra\Geofencing\Concerns\HasGeofence} trait
 * provides column-backed implementations of every method — models that
 * follow the standard schema get all seven methods for free.
 *
 * Return types deliberately use `mixed` for the geometry surfaces —
 * `clickbar/laravel-magellan` is an OPTIONAL peer dependency. Consumers
 * that have Magellan installed will return
 * `Clickbar\Magellan\Data\Geometries\Polygon` / `Point`; consumers without
 * Magellan may return whatever their own geometry backing exposes. The
 * evaluator only needs a shape it can call `toArray()` / iterate on.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
interface Geofenceable
{
    /**
     * The fence polygon, or null when the model has no polygon.
     *
     * When present, the evaluator uses point-in-polygon + distance-to-
     * polygon. When null, the evaluator falls back to radius mode against
     * {@see locationPoint()} and {@see geofenceRadiusM()}.
     */
    public function geofencePolygon(): mixed;

    /**
     * The centroid / anchor point for radius-mode fallback, or null when
     * the model has no location.
     */
    public function locationPoint(): mixed;

    /**
     * The radius in meters for radius-mode fallback, or null when the
     * model has no configured radius (evaluator falls back to
     * `geofencing.evaluator.default_radius_m`).
     */
    public function geofenceRadiusM(): ?int;

    /**
     * GPS accuracy ceiling in meters. Reports with accuracy > this
     * threshold yield a `SKIPPED` verdict.
     */
    public function geofenceAccuracyToleranceM(): int;

    /**
     * Whether the fenceable's enforcement toggle is on. The evaluator DOES
     * NOT read this — it's here so consuming features can inspect the
     * toggle to decide whether to block on an `OUTSIDE` verdict.
     */
    public function isGeofenceEnforcementEnabled(): bool;

    /**
     * The registered `#[Geofenceable]` alias for this model.
     */
    public function geofenceableAlias(): string;
}
