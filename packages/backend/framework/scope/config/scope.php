<?php

/**
 * @file config/scope.php
 *
 * @description
 * Runtime configuration for the `academorix/scope` framework package.
 * Merged into Laravel's config repository under the `scope.*` key by
 * ScopeServiceProvider. Every entry is documented in place so a
 * fresh contributor can reason about the knob before touching it.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Resolution
    |--------------------------------------------------------------------------
    |
    | Bounds the runtime behaviour of Scope::resolve() and the resolver
    | chain. Every read cascades UP the materialised path of the active
    | node; these numbers guard against runaway trees.
    |
    */
    'resolution' => [
        /** Maximum tree depth walker will traverse before aborting. */
        'max_depth' => 10,

        /** Timeout in milliseconds for a single resolve() call. */
        'timeout_ms' => 2_000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | Resolution results are cached under tags derived from the active
    | scope's materialised_path. Invalidation cascades correctly when a
    | node's ancestor chain changes.
    |
    */
    'cache' => [
        /** Set to false in tests that assert on stale reads. */
        'enabled' => (bool) env('SCOPE_CACHE_ENABLED', true),

        /** Time-to-live in seconds for cached resolutions. */
        'ttl' => (int) env('SCOPE_CACHE_TTL', 300),

        /** Cache store to use; defaults to Laravel's default. */
        'store' => env('SCOPE_CACHE_STORE', null),

        /** Prefix for every scope-related cache key. */
        'prefix' => env('SCOPE_CACHE_PREFIX', 'scope'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    |
    | HeaderScopeResolver reads the active scope node id from this
    | request header. Renaming it lets deployments avoid collisions
    | with reverse proxies that may strip custom headers.
    |
    */
    'header' => [
        'name' => env('SCOPE_HEADER_NAME', 'X-Scope-Node-Id'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    |
    | ResolveScope middleware alias — appended to Laravel's route
    | middleware map by the service provider so route files can attach
    | it by name (`->middleware('scope')`) instead of by class-string.
    |
    */
    'middleware' => [
        'alias' => env('SCOPE_MIDDLEWARE_ALIAS', 'scope'),

        /**
         * When true, ResolveScope hard-fails a request that ends the
         * chain with no active scope. Set to false for public routes
         * that tolerate an anonymous scope (marketing site, health).
         */
        'strict' => (bool) env('SCOPE_MIDDLEWARE_STRICT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Eloquent auto-scoping
    |--------------------------------------------------------------------------
    |
    | The ScopedGlobalScope global scope automatically filters models
    | that carry `#[ScopedTo]` by the current scope's ancestor chain.
    | Disable globally in tests that need to see cross-scope rows.
    |
    */
    'eloquent' => [
        'auto_scope_enabled' => (bool) env('SCOPE_ELOQUENT_AUTO_SCOPE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Namespace policy
    |--------------------------------------------------------------------------
    |
    | Consumer namespaces must match this regex. 1–64 lowercase
    | alphanumerics + underscores, starting with a letter. The
    | registry rejects registrations outside this shape.
    |
    */
    'namespace_regex' => '/^[a-z][a-z0-9_]{0,63}$/',
];
