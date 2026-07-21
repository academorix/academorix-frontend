<?php

/**
 * @file modules/shared/activity/lang/en/activity.php
 *
 * @description
 * English translations for the `stackra/activity` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'         => 'The requested activity row does not exist or is not visible to you.',
        'cross_tenant_read' => 'Activity rows are tenant-scoped — this row belongs to a different tenant.',
    ],

    'labels' => [
        'activity'   => 'Activity',
        'activities' => 'Activities',
        'feed'       => 'Activity feed',
        'causer'     => 'Actor',
        'subject'    => 'Target',
        'event'      => 'Event',
        'log_name'   => 'Log',
        'batch'      => 'Batch',
    ],

    'events' => [
        'created'  => 'created',
        'updated'  => 'updated',
        'deleted'  => 'deleted',
        'restored' => 'restored',
    ],
];
