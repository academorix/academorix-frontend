<?php

/**
 * @file packages/scheduling/config/scheduling.php
 *
 * @description
 * Configuration for the scheduling package. Merged into the host
 * app's config under the `scheduling.*` key by
 * {@see \Academorix\Scheduling\Providers\SchedulingServiceProvider}.
 *
 * ## Consumers at a glance
 *
 *   - `discovery.paths`   — {@see \Academorix\Scheduling\Support\ScheduleDiscovery}
 *                           uses this only when the
 *                           `olvlvl/composer-attribute-collector`
 *                           manifest is empty (no build ran) as a
 *                           fallback scan target list. Under normal
 *                           operation discovery is manifest-driven
 *                           and the paths list is ignored.
 *
 *   - `discovery.cache`   — When `true`,
 *                           {@see \Academorix\Scheduling\Support\ScheduleRegistrar}
 *                           writes the discovered task set to
 *                           `bootstrap/cache/scheduling.php` so the
 *                           next boot skips the attribute walk.
 *
 *   - `timezone`          — Default timezone applied to every
 *                           schedule that does NOT carry an
 *                           explicit `#[Timezone(...)]` attribute.
 *                           `null` leaves Laravel's own default in
 *                           charge (`app.timezone`).
 */

declare(strict_types=1);

return [

    /*
    |----------------------------------------------------------------------
    | Discovery
    |----------------------------------------------------------------------
    |
    |   - `paths`  — Fallback directories the discovery layer would
    |                walk if the composer-attribute-collector
    |                manifest is missing. Under normal operation the
    |                manifest already contains every attributed class
    |                so this list is unused. Kept here as an escape
    |                hatch for CI images that skip the composer
    |                autoload dump.
    |
    |   - `cache`  — Cache the discovery result to
    |                `bootstrap/cache/scheduling.php`. Turn OFF in
    |                development so newly-attributed jobs get picked
    |                up without a manual cache clear.
    */

    'discovery' => [
        'paths' => [
            // Example: base_path('app/Jobs'),
        ],

        'cache' => (bool) env('SCHEDULING_CACHE', true),

        /*
        |----------------------------------------------------------------------
        | Cache path
        |----------------------------------------------------------------------
        |
        | Absolute filesystem path to the on-disk cache produced by
        | {@see \Academorix\Scheduling\Support\ScheduleRegistrar}.
        | Read via `#[Config('scheduling.discovery.cache_path')]` on
        | the registrar's constructor so the value is snapshotted at
        | boot; no per-request container reach.
        |
        | Default resolves to `bootstrap/cache/scheduling.php` under
        | the host app. Override via the `SCHEDULING_CACHE_PATH`
        | environment variable when the host app runs from a
        | read-only image and needs to redirect writes to a
        | writable volume.
        */

        'cache_path' => env(
            'SCHEDULING_CACHE_PATH',
            function_exists('base_path')
                ? base_path('bootstrap/cache/scheduling.php')
                : null,
        ),
    ],

    /*
    |----------------------------------------------------------------------
    | Default timezone
    |----------------------------------------------------------------------
    |
    | Applied to every schedule that does NOT carry an explicit
    | `#[Timezone(...)]` attribute. Leave `null` to let Laravel's
    | `app.timezone` take precedence.
    |
    | Override in Doppler:
    |
    |     SCHEDULING_TIMEZONE=Africa/Casablanca
    */

    'timezone' => env('SCHEDULING_TIMEZONE'),

];
