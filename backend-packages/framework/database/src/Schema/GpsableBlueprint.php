<?php

declare(strict_types=1);

/**
 * Gpsable Blueprint Schema Macro.
 *
 * Registers the `gpsable()` Blueprint macro for adding latitude and
 * longitude decimal columns to migration tables. Uses DECIMAL(10,7)
 * precision which provides ~1.1cm accuracy — sufficient for virtually
 * all GPS-based applications.
 *
 * ## Columns Added:
 * - `latitude` (decimal(10,7), nullable) — or custom column name
 * - `longitude` (decimal(10,7), nullable) — or custom column name
 *
 * ## Precision Notes:
 * - DECIMAL(10,7) supports values from -999.9999999 to 999.9999999
 * - Latitude range: -90.0000000 to 90.0000000
 * - Longitude range: -180.0000000 to 180.0000000
 * - 7 decimal places ≈ 1.1cm precision
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('stores', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->gpsable();          // Adds 'latitude' and 'longitude' columns
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column names:
 * ```php
 * Schema::create('delivery_points', function (Blueprint $table) {
 *     $table->id();
 *     $table->gpsable('lat', 'lng'); // Custom column names
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Querying by coordinates:
 * ```php
 * // Find stores within a bounding box:
 * Store::whereBetween('latitude', [24.396308, 49.384358])
 *     ->whereBetween('longitude', [-125.0, -66.93457])
 *     ->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Schema\Blueprint
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the gpsable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: GpsableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds gpsable() macro for latitude/longitude decimal columns',
    priority: 25,
)]
class GpsableBlueprint
{
    /**
     * Register the gpsable() macro on the Blueprint class.
     *
     * Creates two nullable DECIMAL(10,7) columns for latitude and
     * longitude. Both columns are nullable because GPS coordinates
     * may not be available at record creation time.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('gpsable', function (
            string $latColumn = 'latitude',
            string $lngColumn = 'longitude',
        ): void {
            /** @var Blueprint $this */

            // Latitude — DECIMAL(10,7) for ~1.1cm precision, nullable for optional GPS data
            $this->decimal($latColumn, 10, 7)->nullable();

            // Longitude — DECIMAL(10,7) for ~1.1cm precision, nullable for optional GPS data
            $this->decimal($lngColumn, 10, 7)->nullable();
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
