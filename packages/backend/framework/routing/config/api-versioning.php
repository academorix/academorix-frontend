<?php

/**
 * @file packages/routing/config/api-versioning.php
 *
 * @description
 * Publishable configuration for the routing package's API-versioning
 * subsystem. Merged into the host app under the `api-versioning.*`
 * key by {@see \Stackra\Routing\Providers\ApiVersioningServiceProvider}.
 *
 * Every value below is INJECTED into
 * {@see \Stackra\Routing\Middleware\DetectApiVersion} as a
 * plain array at boot time, so the middleware never touches the
 * config store during request handling. That keeps the hot path
 * allocation-free and avoids surprising behaviour when the
 * config store is warmed by a competing worker under Octane.
 *
 * ## Environment overrides
 *
 * Each setting takes an env fallback so operators can flip
 * strategies / defaults per environment without shipping a code
 * change. Never inline `env()` deep inside application code — the
 * config layer is the only sanctioned place to call it.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Resolution strategies
    |--------------------------------------------------------------------------
    |
    | Ordered list of strategies the DetectApiVersion middleware tries to
    | extract the client's requested API version from. The FIRST strategy
    | that yields a non-empty value wins. Remove entries to disable a
    | channel (e.g. drop `path` for pure header-driven APIs).
    |
    | Supported values: 'header', 'accept', 'query', 'path'.
    */

    'strategies' => ['header', 'accept', 'query', 'path'],

    /*
    |--------------------------------------------------------------------------
    | Default version
    |--------------------------------------------------------------------------
    |
    | Version emitted when none of the enabled strategies produce a value.
    | Keep in sync with the newest STABLE version the platform ships — this
    | is the version un-negotiated clients will land on.
    */

    'default_version' => env('API_VERSION_DEFAULT', 'v1'),

    /*
    |--------------------------------------------------------------------------
    | Header name
    |--------------------------------------------------------------------------
    |
    | Which HTTP request header the middleware inspects for the `header`
    | strategy. `X-API-Version` is the de-facto convention; some large
    | providers prefer `Api-Version` (no prefix).
    */

    'header_name' => env('API_VERSION_HEADER', 'X-API-Version'),

    /*
    |--------------------------------------------------------------------------
    | Query parameter key
    |--------------------------------------------------------------------------
    |
    | The GET query key inspected for the `query` strategy.
    */

    'query_key' => env('API_VERSION_QUERY_KEY', 'api_version'),

    /*
    |--------------------------------------------------------------------------
    | Path parameter name
    |--------------------------------------------------------------------------
    |
    | Route parameter name captured by the `path` strategy. For a prefix
    | like `/api/v{version}/...`, this is the string `"version"`.
    */

    'path_parameter' => env('API_VERSION_PATH_PARAM', 'version'),

    /*
    |--------------------------------------------------------------------------
    | Accept header pattern
    |--------------------------------------------------------------------------
    |
    | Full PCRE regex applied to the `Accept` header for the `accept`
    | strategy. MUST contain exactly one capturing group holding the
    | version literal. The default matches both
    |
    |   application/vnd.api+json; version=v2
    |   application/vnd.acme.v3+json
    |
    | Any other custom media-type versioning scheme is a one-line swap.
    */

    'accept_pattern' => '/(?:;\s*version=|vnd\.[a-z0-9._-]+\.)(v?\d+(?:\.\d+)*)/i',

    /*
    |--------------------------------------------------------------------------
    | Sunset enforcement
    |--------------------------------------------------------------------------
    |
    | When TRUE, requests to endpoints whose #[Sunsets] date has passed
    | are REJECTED with 410 Gone. When FALSE, only the informational
    | `Sunset` / `Deprecation` headers are emitted and the request is
    | still served. Enable this once the platform has migrated all known
    | clients — leaving it off is safer during rollout.
    */

    'enforce_sunsets' => (bool) env('API_VERSION_ENFORCE_SUNSETS', false),

];
