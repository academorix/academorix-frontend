<?php

/**
 * @file modules/platform/integrations/config/integrations.php
 *
 * @description
 * Runtime knobs for the `academorix/integrations` module. Merged
 * under the `integrations.*` key by the base ServiceProvider's
 * LoadsResources concern. Downstream reads via `config('integrations.*')`.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | The Eloquent repository ships `#[Cacheable(ttl: 300)]` — a
    | shorter TTL than most modules because integration state
    | (last_sync_at, sync_cursor) rotates frequently.
    */
    'cache' => [
        'ttl' => env('INTEGRATIONS_CACHE_TTL', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | KMS
    |--------------------------------------------------------------------------
    |
    | The KMS key id used to derive the `config` column's encryption
    | envelope. Read by consumer app's `IntegrationSecretsCipher`
    | binding — the default `NullIntegrationSecretsCipher` ignores
    | this key entirely.
    */
    'kms' => [
        'key_id' => env('INTEGRATIONS_KMS_KEY_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sync scheduling
    |--------------------------------------------------------------------------
    |
    | `default_sync_interval_minutes` — the observer sets
    | `next_sync_at = now() + interval` whenever `is_active`
    | transitions to true. Individual integrations may override via
    | the driver's own scheduling policy.
    */
    'sync' => [
        'default_sync_interval_minutes' => env('INTEGRATIONS_SYNC_INTERVAL', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Soft-deleted rows past `hard_delete_days` are permanently purged
    | by `integrations:purge-disabled` → PurgeDisabledIntegrationJob.
    */
    'retention' => [
        'hard_delete_days' => env('INTEGRATIONS_HARD_DELETE_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Providers whitelist
    |--------------------------------------------------------------------------
    |
    | Map of `IntegrationKind` backing value → list of allowed provider
    | keys. `ValidIntegrationProvider` consults this map on every
    | write. Extend per deploy — real deployments layer additional
    | providers on top of this baseline.
    */
    'providers' => [
        'sso_saml' => ['okta', 'azure_ad', 'onelogin', 'google_workspace', 'custom_saml'],
        'sso_oidc' => ['okta', 'azure_ad', 'onelogin', 'google_workspace', 'auth0', 'custom_oidc'],
        'scim'     => ['okta', 'azure_ad', 'onelogin', 'rippling'],
        'hris'     => ['workday', 'rippling', 'bamboohr', 'gusto', 'adp'],
        'lms'      => ['canvas', 'blackboard', 'moodle', 'powerschool', 'schoology'],
        'webhook'  => ['zapier', 'make', 'n8n', 'custom'],
        'sms'      => ['twilio', 'messagebird', 'vonage', 'aws_sns'],
        'email'    => ['sendgrid', 'postmark', 'mailgun', 'aws_ses', 'resend'],
    ],
];
