<?php

/**
 * @file modules/shared/versioning/lang/en/versioning.php
 *
 * @description
 * English translations for the `stackra/versioning` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'version_not_found'          => 'The requested API version does not exist.',
        'version_deprecated'         => 'The API version you are calling is deprecated. See the Deprecation header for details.',
        'version_sunset'             => 'The API version you are calling has been sunset and is no longer served.',
        'unknown_scheme'             => 'Unknown version scheme :scheme.',
        'no_transformer'             => 'No payload transformer is registered for :surface :event :from -> :to.',
        'transformer_missing'        => 'No transformer chain resolves :from -> :to for :surface :event.',
        'incompatible_transformation' => 'A transformer refused the incoming payload.',
        'invalid_state_transition'   => 'Illegal state transition attempted on the ApiVersion.',
        'migration_target_invalid'   => 'The migration target slug is invalid or unreachable.',
        'multiple_defaults'          => 'More than one ApiVersion has is_default=true. Data integrity failure.',
        'no_default'                 => 'No default ApiVersion is configured — resolution cannot fall back.',
        'sunset_not_yet_due'         => 'Sunset is scheduled in the future — pass --force to override.',
        'notice_already_published'   => 'This deprecation notice is already published.',
        'notice_published_edit_refused' => 'Published notices are append-only. Create a revised draft and publish it.',
        'subscription_references_version' => 'This ApiVersion cannot be deleted while webhook subscriptions reference it.',
        'invalid_slug'               => 'The API version slug is invalid.',
    ],

    'validation' => [
        'valid_version_slug'          => 'The :attribute must be a valid version slug (e.g. v1, v1.2, v1.2.3).',
        'valid_version_scheme'        => 'The :attribute must be one of: semver, calver.',
        'valid_transformer_signature' => 'The :attribute must reference a class with a public transform(array): array method.',
    ],

    'labels' => [
        'api_version'         => 'API Version',
        'api_versions'        => 'API Versions',
        'deprecation_notice'  => 'Deprecation Notice',
        'deprecation_notices' => 'Deprecation Notices',
    ],
];
