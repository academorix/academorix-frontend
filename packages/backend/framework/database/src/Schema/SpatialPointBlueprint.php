<?php

declare(strict_types=1);

/**
 * Spatial Point Blueprint Schema Macro.
 *
 * Registers the `spatialPoint()` Blueprint macro for adding PostGIS
 * Point geometry columns to migration tables. Point columns store a
 * single geographic coordinate (latitude/longitude) as a native
 * geometry type with a spatial index for efficient geospatial queries.
 *
 * ## Column Added:
 * - `location` (geometry/point, SRID 4326, spatial index) — or custom column name
 *
 * ## Requirements:
 * - PostgreSQL with PostGIS extension enabled
 * - `CREATE EXTENSION IF NOT EXISTS postgis;` must be run before using spatial columns
 *
 * ## SRID Notes:
 * - SRID 4326 (WGS 84) is the standard GPS coordinate system
 * - Used by Google Maps, OpenStreetMap, and most GPS devices
 * - Coordinates are in (longitude, latitude) order in WKT format
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('stores', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialPoint();     // Adds 'location' Point column with spatial index
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name and SRID:
 * ```php
 * Schema::create('warehouses', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialPoint('coordinates', 3857); // Web Mercator projection
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Querying with PostGIS:
 * ```php
 * // Find stores within 5km of a point:
 * Store::whereRaw("ST_DWithin(location, ST_MakePoint(?, ?)::geography, ?)", [
 *     $longitude, $latitude, 5000
 * ])->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Schema\Blueprint::geometry()
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Stackra\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Stackra\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the spatialPoint() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: SpatialPointBlueprint::register()
 *
 * NOTE: Requires PostgreSQL with PostGIS extension. The geometry() and
 * spatialIndex() methods are provided by Laravel's PostgreSQL grammar.
 */
#[AsDatabaseBlueprint(
    description: 'Adds spatialPoint() macro for PostGIS Point geometry columns',
    priority: 30,
)]
class SpatialPointBlueprint
{
    /**
     * Register the spatialPoint() macro on the Blueprint class.
     *
     * Creates a Point geometry column with the specified SRID and
     * a spatial index for efficient geospatial queries (ST_DWithin,
     * ST_Distance, ST_Contains, etc.).
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('spatialPoint', function (string $column = 'location', int $srid = 4326): ColumnDefinition {
            /** @var Blueprint $this */

            // Point geometry column — uses PostGIS native type with spatial index for geo queries
            return $this->geometry($column, 'point', $srid)->spatialIndex();
        });
    }

    /**
     * Invoke the macro registration (for auto-discovery via #[AsDatabaseBlueprint]).
     *
     * @return void
     */
    public function __invoke(): void
    {
        self::register();
    }
}
