<?php

/**
 * @file modules/shared/versioning/config/versioning.php
 *
 * @description
 * Runtime knobs for the `stackra/versioning` module. Mirrors the
 * blueprint at `modules/shared/versioning/config.json`.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Default version
    |--------------------------------------------------------------------------
    |
    | Fallback slug when the resolver chain returns null. Must match
    | an ApiVersion row with `is_default = true`.
    */
    'default' => env('VERSIONING_DEFAULT', 'v1'),

    /*
    |--------------------------------------------------------------------------
    | Resolvers
    |--------------------------------------------------------------------------
    |
    | Ordered list of resolvers. First non-null wins. `query` is
    | usually enabled only in non-production environments.
    */
    'resolvers' => [
        'order' => ['url', 'header', 'webhook', 'graphql', 'query'],

        'url' => [
            'prefix' => env('VERSIONING_URL_PREFIX', '/api'),
        ],

        'header' => [
            'accept_pattern' => env(
                'VERSIONING_ACCEPT_PATTERN',
                'application/vnd.stackra.{version}+json',
            ),
        ],

        'query' => [
            'enabled_environments' => ['local', 'testing', 'staging'],
            'param_name'           => env('VERSIONING_QUERY_PARAM', 'version'),
            'enabled'              => env('VERSIONING_QUERY_ENABLED', false),
        ],

        'webhook' => [
            'subscription_column' => env('VERSIONING_WEBHOOK_COLUMN', 'api_version'),
            'request_attribute'   => 'stackra.versioning.webhook_subscription_version',
        ],

        'graphql' => [
            'directive_name' => env('VERSIONING_GRAPHQL_DIRECTIVE', 'api'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Schemes
    |--------------------------------------------------------------------------
    |
    | Version scheme adapters. Selected per-ApiVersion via the `scheme`
    | column and dispatched through {@see VersionSchemeRegistryInterface}.
    */
    'schemes' => [
        'default'   => env('VERSIONING_DEFAULT_SCHEME', 'semver'),
        'available' => ['semver', 'calver'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Sunset
    |--------------------------------------------------------------------------
    |
    | Governs the RFC 8594 Sunset workflow — when a deprecated version
    | is scheduled to sunset, reminder windows, and whether sunset
    | responses actually 410.
    */
    'sunset' => [
        'default_notice_days'   => (int) env('VERSIONING_SUNSET_DEFAULT_DAYS', 180),
        'reminder_windows_days' => [30, 7, 3, 1],
        'enforce_410'           => env('VERSIONING_SUNSET_ENFORCE_410', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Response headers
    |--------------------------------------------------------------------------
    |
    | Header names emitted by `ResolveVersioning` + the sunset emitter.
    | Named for override so downstream apps can prefix per platform
    | convention.
    */
    'headers' => [
        'api_version'         => 'X-API-Version',
        'deprecation'         => 'Deprecation',
        'sunset'              => 'Sunset',
        'link_successor_rel'  => 'successor-version',
    ],

    /*
    |--------------------------------------------------------------------------
    | Payload transformers
    |--------------------------------------------------------------------------
    |
    | Registry of `#[AsPayloadTransformer]`-marked classes. Hydrated
    | at boot by the framework's generic HydrationBootstrapper via the
    | `#[HydratesFrom(AsPayloadTransformer::class)]` declaration on
    | `PayloadTransformerRegistryInterface::register()`.
    */
    'transformers' => [
        'compiler_cache_path' => env(
            'VERSIONING_TRANSFORMER_CACHE',
            'bootstrap/cache/versioning-transformers.php',
        ),
        'max_chain_length' => (int) env('VERSIONING_TRANSFORMER_MAX_CHAIN', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL support
    |--------------------------------------------------------------------------
    |
    | Enable the GraphQL resolver + the `#[VersionedField]` attribute
    | scanner. Feature-flag gated because most consumer apps run REST
    | only.
    */
    'graphql_support' => env('VERSIONING_GRAPHQL_SUPPORT', false),

    /*
    |--------------------------------------------------------------------------
    | Analytics
    |--------------------------------------------------------------------------
    |
    | Sampling rate for the "Api Version Used" analytics event.
    | 0.0-1.0. Default 1% — signal without cost.
    */
    'analytics' => [
        'usage_sample_rate' => (float) env('VERSIONING_ANALYTICS_SAMPLE_RATE', 0.01),
    ],
];
