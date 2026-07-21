<?php

/**
 * @file packages/events/config/events.php
 *
 * @description
 * Configuration for the events package. Merged into the host app's
 * config as `events.*` by
 * {@see \Stackra\Events\Providers\EventsServiceProvider}.
 *
 * ## Consumers at a glance
 *
 *   - `discovery.paths`   — Extra source roots the discovery
 *                           scanner considers on top of the
 *                           `olvlvl/composer-attribute-collector`
 *                           manifest. Reserved for future manual
 *                           scans; the manifest is authoritative
 *                           today.
 *
 *   - `discovery.cache`   — Toggle for the on-disk listener
 *                           manifest cache under
 *                           `bootstrap/cache/events.php`. Turn OFF
 *                           in development to always rescan; leave
 *                           ON in production. The cache file is
 *                           invalidated whenever composer dumps a
 *                           new autoloader (which regenerates the
 *                           attribute-collector manifest).
 *
 *   - `broadcast.default_channel_type` — Channel type used by
 *                                        {@see \Stackra\Events\Attributes\BroadcastOn}
 *                                        when the event class did
 *                                        not declare an explicit
 *                                        `channelType` on its
 *                                        `#[Broadcastable]`.
 */

declare(strict_types=1);

return [

    /*
    |----------------------------------------------------------------------
    | Discovery
    |----------------------------------------------------------------------
    |
    | The event discovery scanner walks the
    | `olvlvl/composer-attribute-collector` manifest at boot to build
    | the `Event => [Listeners]` map. The manifest is written at
    | `composer dump-autoload` time, so runtime is a pure hashmap
    | lookup — zero reflection cost per boot.
    |
    | `paths` is reserved for future extension when we support
    | ad-hoc directories (e.g. host-app `app/Listeners/`) alongside
    | the manifest. Today it's an empty list — the manifest is
    | authoritative.
    |
    | `cache` toggles the on-disk snapshot under
    | `bootstrap/cache/events.php`. When true, the scanner writes
    | the resolved map once and re-uses it on subsequent boots.
    | The file is invalidated by `composer dump-autoload` because
    | the underlying manifest hash changes. Keep OFF in local dev
    | so newly added listeners register on the next request.
    */

    'discovery' => [

        'paths' => [
            // Extra source roots the scanner walks in addition to
            // the composer-attribute-collector manifest. Absolute
            // paths only. Reserved — leave empty in production.
        ],

        'cache' => (bool) env('EVENTS_DISCOVERY_CACHE', true),

        /*
        |----------------------------------------------------------------------
        | Cache path
        |----------------------------------------------------------------------
        |
        | Absolute filesystem path to the on-disk manifest cache.
        | Read via `#[Config('events.discovery.cache_path')]` on
        | {@see \Stackra\Events\Support\EventDiscovery}'s
        | constructor so the value is snapshotted at boot; no
        | per-request container reach.
        |
        | Default resolves to `bootstrap/cache/events.php` under the
        | host app. Override via the `EVENTS_DISCOVERY_CACHE_PATH`
        | environment variable when the host app runs from a
        | read-only image and needs to redirect writes to a writable
        | volume.
        */

        'cache_path' => env(
            'EVENTS_DISCOVERY_CACHE_PATH',
            function_exists('base_path')
                ? base_path('bootstrap/cache/events.php')
                : null,
        ),

    ],

    /*
    |----------------------------------------------------------------------
    | Broadcasting
    |----------------------------------------------------------------------
    |
    | `default_channel_type` — Channel type applied by
    | {@see \Stackra\Events\Support\BroadcastConfigurator} when
    | resolving the channels named by `#[BroadcastOn]` on an event
    | class that did not declare its own `channelType` on
    | `#[Broadcastable]`. One of `public`, `private`, or `presence`.
    */

    'broadcast' => [

        'default_channel_type' => (string) env('EVENTS_BROADCAST_DEFAULT_CHANNEL_TYPE', 'private'),

    ],

];
