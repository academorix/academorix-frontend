<?php

/**
 * @file packages/framework/caching/config/caching.php
 *
 * @description
 * Runtime configuration for `academorix/caching`. Every value is
 * overridable via a `caching.*` entry in the consuming app's
 * config or the equivalent env var. Values documented here are
 * the safest defaults for a multi-tenant production deployment
 * running Redis; local dev on the array driver silently ignores
 * every tag path via {@see \Academorix\Caching\Support\TaggableCacheGuard}.
 */

declare(strict_types=1);

return [

    /*
    |----------------------------------------------------------------
    | Default TTL (seconds)
    |----------------------------------------------------------------
    |
    | Fallback TTL applied by `#[Cacheable]` when a class / method
    | doesn't specify its own. 300 s (5 min) is a conservative
    | default that assumes cache warmness matters more than
    | freshness for the average read.
    |
    */
    'default_ttl' => (int) env('CACHE_DEFAULT_TTL', 300),

    /*
    |----------------------------------------------------------------
    | Tag prefix
    |----------------------------------------------------------------
    |
    | Static prefix prepended to every tag emitted by the tag
    | builder. Useful when a single Redis instance is shared by
    | multiple apps and you want a bulk `KEYS 'academorix:*'`
    | sweep to be scoped.
    |
    */
    'tag_prefix' => env('CACHE_TAG_PREFIX', 'academorix'),

    /*
    |----------------------------------------------------------------
    | Fail-open on driver mismatch
    |----------------------------------------------------------------
    |
    | When `true`, the `TaggableCacheGuard` silently degrades tag
    | operations on drivers that don't support tags (array, file,
    | database). When `false`, unsupported operations throw so
    | test suites catch mis-configured drivers early.
    |
    | Production Redis MUST support tags — this flag is only
    | relevant for local dev and CI.
    |
    */
    'fail_open_untagged' => (bool) env('CACHE_FAIL_OPEN_UNTAGGED', true),

    /*
    |----------------------------------------------------------------
    | Automatic cache-aside via `#[Cacheable]`
    |----------------------------------------------------------------
    |
    | Master switch for the boot-time reflection pass that wires
    | `#[Cacheable]` interceptors onto container-resolved services.
    | Disable when a hot path is measured to be cache-neutral so
    | the reflection walk doesn't run on every deploy.
    |
    */
    'auto_cacheable' => (bool) env('CACHE_AUTO_CACHEABLE', true),

    /*
    |----------------------------------------------------------------
    | Resolver discovery
    |----------------------------------------------------------------
    |
    | List of paths (relative to base_path) walked at boot to
    | discover `#[AsCacheTagResolver]` implementations. Left empty
    | to defer entirely to olvlvl/composer-attribute-collector's
    | index; set explicitly only when you need to constrain
    | discovery to a subset of the app.
    |
    */
    'resolver_paths' => [],

];
