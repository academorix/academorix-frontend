<?php

/**
 * @file modules/products/geofencing/lang/en/geofencing.php
 *
 * @description
 * English translations for the `stackra/geofencing` module. Loaded under
 * the `geofencing::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        'fenceable_not_in_tenant'      => 'Geofence subject not found or not in this tenant.',
        'fenceable_alias_unregistered' => 'The submitted fenceable_type is not registered.',
        'fenceable_not_geofenceable'   => 'The resolved class does not implement the Geofenceable interface.',
        'accuracy_too_low'             => 'GPS accuracy exceeds the tolerance. Retry when signal improves.',
        'polygon_invalid'              => 'The submitted polygon is invalid.',
        'fenceable_no_geometry'        => 'The fenceable model has neither a polygon nor a location point.',
        'override_reason_too_short'    => 'Override reason must be at least :length characters.',
        'override_already_applied'     => 'The original check already has an applied override.',
        'override_original_inside'     => 'Cannot request an override on an INSIDE check.',
        'immutability_violation'       => 'GeofenceCheck rows are immutable — cannot be updated.',
        'postgis_unavailable'          => 'PostGIS extension is not available.',
        'preflight_rate_limited'       => 'Too many preflight requests. Retry later.',
        'evaluation_quota_exceeded'    => 'Monthly evaluation quota exceeded.',
        'subject_type_unregistered'    => 'The submitted subject_type is not registered.',
        'duplicate_alias_at_boot'      => 'Duplicate geofence alias detected at boot.',
    ],

    'labels' => [
        'geofence_check'  => 'Geofence Check',
        'geofence_checks' => 'Geofence Checks',
        'result'          => 'Result',
        'mode'            => 'Mode',
        'accuracy'        => 'Accuracy (m)',
        'distance'        => 'Distance (m)',
    ],
];
