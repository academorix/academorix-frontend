<?php

/**
 * @file modules/platform/branding/lang/en/branding.php
 *
 * @description
 * English translations for the `academorix/branding` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'    => 'No branding profile found for this tenant.',
        'last_default' => 'Cannot delete the tenant\'s last default branding. Promote another profile first.',
    ],

    'validation' => [
        'valid_hex_color' => 'The :attribute must be a valid `#RRGGBB` hex color.',
    ],

    'labels' => [
        'branding'  => 'Branding',
        'brandings' => 'Branding Profiles',
    ],
];
