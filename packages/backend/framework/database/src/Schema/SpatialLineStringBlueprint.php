<?php

declare(strict_types=1);

/**
 * Spatial LineString Blueprint Schema Macro.
 *
 * Registers the `spatialLineString()` Blueprint macro for adding PostGIS
 * LineString geometry columns to migration tables. LineString columns store
 * ordered sequences of points — useful for routes, paths, trails, and
 * linear geographic features.
 *
 * ## Column Added:
 * - `route_geometry` (geometry/linestring, SRID 4326, spatial index) — or custom column name
 *
 * ## Requirements:
 * - PostgreSQL with PostGIS extension enabled
 * - `CREATE EXTENSION IF NOT EXISTS postgis;` must be run before using spatial columns
 *
 * ## SRID Notes:
 * - SRID 4326 (WGS 84) is the standard GPS coordinate system
 * - LineString is an ordered sequence of two or more points
 * - Coordinates are in (longitude, latitude) order in WKT format
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('routes', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialLineString(); // Adds 'route_geometry' LineString column with spatial index
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name and SRID:
 * ```php
 * Schema::create('trails', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialLineString('path', 3857); // Web Mercator projection
 *     $table->decimal('distance_km', 8, 2);
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Querying with PostGIS:
 * ```php
 * // Calculate route length in meters:
 * $length = DB::raw("ST_Length(route_geometry::geography)");
 *
 * // Find routes that intersect a polygon:
 * Route::whereRaw("ST_Intersects(route_geometry, ?)", [$polygon])->get();
 *
 * // Get the start point of a route:
 * $start = DB::raw("ST_StartPoint(route_geometry)");
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
 * Registers the spatialLineString() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: SpatialLineStringBlueprint::register()
 *
 * NOTE: Requires PostgreSQL with PostGIS extension. The geometry() and
 * spatialIndex() methods are provided by Laravel's PostgreSQL grammar.
 */
#[AsDatabaseBlueprint(
    description: 'Adds spatialLineString() macro for PostGIS LineString geometry columns',
    priority: 30,
)]
class SpatialLineStringBlueprint
{
    /**
     * Register the spatialLineString() macro on the Blueprint class.
     *
     * Creates a LineString geometry column with the specified SRID and
     * a spatial index for efficient linear geospatial queries
     * (ST_Length, ST_Intersects, ST_Buffer, etc.).
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('spatialLineString', function (string $column = 'route_geometry', int $srid = 4326): ColumnDefinition {
            /** @var Blueprint $this */

            // LineString geometry column — uses PostGIS native type with spatial index for route/path queries
            return $this->geometry($column, 'linestring', $srid)->spatialIndex();
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
