<?php

/**
 * @file modules/products/geofencing/config/geofencing.php
 *
 * @description
 * Runtime knobs for the `academorix/geofencing` module. Merged under the
 * `geofencing.*` key by the base ServiceProvider's LoadsResources concern.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Evaluator defaults
    |--------------------------------------------------------------------------
    |
    | Fallbacks for models that return null from the corresponding
    | Geofenceable methods. `max_polygon_diameter_m` is a hard cap — the
    | tangent-plane approximation used by PolygonEvaluator loses precision
    | beyond about 10 km.
    */
    'evaluator' => [
        'default_accuracy_tolerance_m' => (int) env('GEOFENCE_DEFAULT_ACCURACY_TOLERANCE_M', 50),
        'default_radius_m'             => (int) env('GEOFENCE_DEFAULT_RADIUS_M', 100),
        'max_polygon_diameter_m'       => (int) env('GEOFENCE_MAX_POLYGON_DIAMETER_M', 10000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Preflight
    |--------------------------------------------------------------------------
    */
    'preflight' => [
        'rate_limit' => [
            'per_minute' => (int) env('GEOFENCE_PREFLIGHT_RATE_PER_MINUTE', 60),
        ],
        'log_sample_ratio' => (float) env('GEOFENCE_PREFLIGHT_LOG_SAMPLE_RATIO', 1.0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Override workflow
    |--------------------------------------------------------------------------
    */
    'override' => [
        'min_reason_length'  => (int) env('GEOFENCE_OVERRIDE_MIN_REASON_LENGTH', 10),
        'approval_task_type' => env('GEOFENCE_OVERRIDE_APPROVAL_TASK_TYPE', 'geofence_override'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Non-override rows: 7y default hot + 3y cold (soft-deleted +
    | anonymised). Override rows: 10y non-configurable floor — they carry
    | disputed-clock-in evidence.
    */
    'retention' => [
        'default_hot_years'         => (int) env('GEOFENCE_RETENTION_HOT_YEARS', 7),
        'override_row_hot_years'    => (int) env('GEOFENCE_RETENTION_OVERRIDE_HOT_YEARS', 10),
        'cold_years'                => (int) env('GEOFENCE_RETENTION_COLD_YEARS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Morph map
    |--------------------------------------------------------------------------
    |
    | `strict` mode refuses evaluations whose fenceable_type / subject_type is
    | not a registered attribute. Turn off ONLY during migrations from legacy
    | class-name morph values.
    */
    'morph_map' => [
        'strict' => (bool) env('GEOFENCE_MORPH_MAP_STRICT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Trait column defaults
    |--------------------------------------------------------------------------
    |
    | Column names the HasGeofence trait expects on the consumer's own table.
    | Consumer models with non-standard schemas override the Geofenceable
    | interface methods directly instead of retuning these column names.
    */
    'trait' => [
        'column_geofence_polygon'              => 'geofence_polygon',
        'column_location_point'                => 'location_point',
        'column_geofence_radius_m'             => 'geofence_radius_m',
        'column_geofence_accuracy_tolerance_m' => 'geofence_accuracy_tolerance_m',
        'column_geofence_enforcement_enabled'  => 'geofence_enforcement_enabled',
        'column_geofence_updated_at'           => 'geofence_updated_at',
        'column_geofence_updated_by'           => 'geofence_updated_by',
    ],
];
