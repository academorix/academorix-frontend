<?php

/**
 * @file modules/platform/domains/config/domains.php
 *
 * @description
 * Runtime knobs for the `academorix/domains` module. Merged under the
 * `domains.*` key by the base ServiceProvider's LoadsResources concern.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Public edge host
    |--------------------------------------------------------------------------
    |
    | The host we point customer CNAMEs at. When the observer seeds the
    | expected CNAME record, this is the value written to `expected_value`.
    */
    'platform_host' => env('DOMAINS_PLATFORM_HOST', 'edge.academorix.app'),

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */
    'verification' => [
        'max_attempts'  => env('DOMAINS_VERIFICATION_MAX_ATTEMPTS', 100),
        'recheck_hours' => env('DOMAINS_VERIFICATION_RECHECK_HOURS', 24),
        'token_bytes'   => env('DOMAINS_VERIFICATION_TOKEN_BYTES', 32),
    ],

    /*
    |--------------------------------------------------------------------------
    | Certificate rotation
    |--------------------------------------------------------------------------
    */
    'certificates' => [
        'renew_before_days' => env('DOMAINS_RENEW_BEFORE_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    */
    'retention' => [
        'domain_hard_delete_days' => env('DOMAINS_HARD_DELETE_DAYS', 7),
    ],
];
