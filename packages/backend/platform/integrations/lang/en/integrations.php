<?php

/**
 * @file modules/platform/integrations/lang/en/integrations.php
 *
 * @description
 * English translations for the `stackra/integrations` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'    => 'No integration found matching the given identifier.',
        'disabled'     => 'This integration is disabled and cannot be synced.',
        'sync_failed'  => 'The integration sync failed: :reason.',
    ],

    'validation' => [
        'valid_integration_provider' => 'The :attribute is not a known provider for the selected integration kind.',
    ],

    'labels' => [
        'integration'  => 'Integration',
        'integrations' => 'Integrations',
    ],
];
