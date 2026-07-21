<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Concerns;

use Academorix\Geofencing\Attributes\Geofenceable as GeofenceableAttribute;
use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Models\GeofenceCheck;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use ReflectionClass;

/**
 * Mixed into any Eloquent model that carries a geofence.
 *
 * Provides column-backed default implementations of every method on the
 * {@see \Academorix\Geofencing\Contracts\Geofenceable} interface. Models with
 * non-standard geometry storage (linked spatial_features table, external
 * service) implement the interface directly and skip the trait.
 *
 * ## Column contract
 *
 *   - `geofence_polygon`              — nullable geometry column.
 *   - `location_point`                — nullable geometry column.
 *   - `geofence_radius_m`             — nullable unsigned integer.
 *   - `geofence_accuracy_tolerance_m` — unsigned integer (default 50).
 *   - `geofence_enforcement_enabled`  — boolean (default false).
 *   - `geofence_updated_at`           — timestamptz nullable.
 *   - `geofence_updated_by`           — string(64) nullable.
 *
 * Consumers add these columns via a migration on their own table. A
 * `Blueprint::addGeofenceColumns()` macro is planned; for now spell the
 * columns out explicitly per column names read from the config's
 * `geofencing.trait.column_*` keys.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
trait HasGeofence
{
    /**
     * Every check tied to this fenceable, newest-first.
     *
     * @return MorphMany<GeofenceCheck, $this>
     */
    public function geofenceChecks(): MorphMany
    {
        return $this->morphMany(
            GeofenceCheck::class,
            'fenceable',
            GeofenceCheckInterface::ATTR_FENCEABLE_TYPE,
            GeofenceCheckInterface::ATTR_FENCEABLE_ID,
        );
    }

    /**
     * The fence polygon, or null. Default reads from the standard
     * `geofence_polygon` column.
     */
    public function geofencePolygon(): mixed
    {
        return $this->getAttribute(
            (string) \config('geofencing.trait.column_geofence_polygon', 'geofence_polygon'),
        );
    }

    /**
     * The centroid point for radius-mode fallback, or null.
     */
    public function locationPoint(): mixed
    {
        return $this->getAttribute(
            (string) \config('geofencing.trait.column_location_point', 'location_point'),
        );
    }

    /**
     * The radius in meters for radius-mode fallback.
     */
    public function geofenceRadiusM(): ?int
    {
        $value = $this->getAttribute(
            (string) \config('geofencing.trait.column_geofence_radius_m', 'geofence_radius_m'),
        );

        return $value === null ? null : (int) $value;
    }

    /**
     * The GPS accuracy tolerance for this fenceable. Falls back to
     * `geofencing.evaluator.default_accuracy_tolerance_m` when the column
     * is null.
     */
    public function geofenceAccuracyToleranceM(): int
    {
        $value = $this->getAttribute(
            (string) \config(
                'geofencing.trait.column_geofence_accuracy_tolerance_m',
                'geofence_accuracy_tolerance_m',
            ),
        );

        if ($value === null) {
            return (int) \config('geofencing.evaluator.default_accuracy_tolerance_m', 50);
        }

        return (int) $value;
    }

    /**
     * Whether the enforcement toggle is on. Consumers read this — the
     * evaluator does NOT.
     */
    public function isGeofenceEnforcementEnabled(): bool
    {
        return (bool) $this->getAttribute(
            (string) \config(
                'geofencing.trait.column_geofence_enforcement_enabled',
                'geofence_enforcement_enabled',
            ),
        );
    }

    /**
     * The `#[Geofenceable]` alias for this model. Read via reflection so the
     * trait doesn't need a separate abstract method every consumer must
     * implement.
     *
     * @throws \RuntimeException  When the class doesn't carry `#[Geofenceable]`.
     */
    public function geofenceableAlias(): string
    {
        $reflection = new ReflectionClass($this);
        $attributes = $reflection->getAttributes(GeofenceableAttribute::class);

        if ($attributes === []) {
            throw new \RuntimeException(\sprintf(
                'Class %s composes HasGeofence but is missing the #[Geofenceable] attribute.',
                static::class,
            ));
        }

        return $attributes[0]->newInstance()->alias;
    }

    /**
     * Whether this fenceable has a polygon drawn.
     */
    public function hasGeofencePolygon(): bool
    {
        return $this->geofencePolygon() !== null;
    }

    /**
     * Whether this fenceable has a radius fallback configured.
     */
    public function hasGeofenceRadius(): bool
    {
        return $this->locationPoint() !== null && $this->geofenceRadiusM() !== null;
    }
}
