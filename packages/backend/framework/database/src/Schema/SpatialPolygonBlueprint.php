<?php

declare(strict_types=1);

/**
 * Spatial Polygon Blueprint Schema Macro.
 *
 * Registers the `spatialPolygon()` Blueprint macro for adding PostGIS
 * Polygon geometry columns to migration tables. Polygon columns store
 * closed geometric shapes — useful for boundaries, zones, geofences,
 * and area-based geospatial queries.
 *
 * ## Column Added:
 * - `boundary` (geometry/polygon, SRID 4326, spatial index) — or custom column name
 *
 * ## Requirements:
 * - PostgreSQL with PostGIS extension enabled
 * - `CREATE EXTENSION IF NOT EXISTS postgis;` must be run before using spatial columns
 *
 * ## SRID Notes:
 * - SRID 4326 (WGS 84) is the standard GPS coordinate system
 * - Polygon coordinates must form a closed ring (first point = last point)
 * - Coordinates are in (longitude, latitude) order in WKT format
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('zones', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialPolygon();   // Adds 'boundary' Polygon column with spatial index
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name and SRID:
 * ```php
 * Schema::create('delivery_areas', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->spatialPolygon('coverage_area', 3857); // Web Mercator projection
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Querying with PostGIS:
 * ```php
 * // Find zones that contain a point:
 * Zone::whereRaw("ST_Contains(boundary, ST_MakePoint(?, ?)::geometry)", [
 *     $longitude, $latitude
 * ])->get();
 *
 * // Calculate area of a zone:
 * $area = DB::raw("ST_Area(boundary::geography)");
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
 * Registers the spatialPolygon() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: SpatialPolygonBlueprint::register()
 *
 * NOTE: Requires PostgreSQL with PostGIS extension. The geometry() and
 * spatialIndex() methods are provided by Laravel's PostgreSQL grammar.
 */
#[AsDatabaseBlueprint(
    description: 'Adds spatialPolygon() macro for PostGIS Polygon geometry columns',
    priority: 30,
)]
class SpatialPolygonBlueprint
{
    /**
     * Register the spatialPolygon() macro on the Blueprint class.
     *
     * Creates a Polygon geometry column with the specified SRID and
     * a spatial index for efficient area-based geospatial queries
     * (ST_Contains, ST_Intersects, ST_Within, etc.).
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('spatialPolygon', function (string $column = 'boundary', int $srid = 4326): ColumnDefinition {
            /** @var Blueprint $this */

            // Polygon geometry column — uses PostGIS native type with spatial index for area queries
            return $this->geometry($column, 'polygon', $srid)->spatialIndex();
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
