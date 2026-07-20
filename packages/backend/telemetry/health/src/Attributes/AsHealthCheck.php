<?php

/**
 * @file packages/health/src/Attributes/AsHealthCheck.php
 *
 * @description
 * Class-level attribute that marks a Spatie Health `Check` for
 * automatic discovery + registration. Every class carrying this
 * attribute is picked up at composer-dump time by
 * `olvlvl/composer-attribute-collector`, then registered against
 * Spatie's Health facade during application boot by the
 * {@see \Academorix\Health\Support\HealthCheckDiscoverer}.
 *
 * ## Why an attribute (and not manual registration)
 *
 * The old backend required each module's `HealthProvider` to list
 * every check in a `checks()` method. That worked, but every new
 * check meant editing the provider — one more place to forget when
 * shipping a check across a feature branch. An attribute reverses
 * the control: the check declares its own metadata, and boot-time
 * discovery finds every check no matter which package it ships in.
 *
 * ## Zero runtime cost
 *
 * Attribute discovery happens once at `composer dump-autoload` time.
 * The result is written to `vendor/attributes.php` — a static PHP
 * file that lists every `#[AsHealthCheck]` target class. Runtime
 * iteration is `include vendor/attributes.php` + `array_filter`, no
 * reflection, no filesystem scan. That keeps boot fast even when
 * the app grows to hundreds of checks across dozens of packages.
 *
 * ## Compile-time-safe metadata
 *
 * Every field on this attribute must be a compile-time constant
 * (string, int, bool, enum case, or class constant reference). PHP
 * evaluates attribute arguments statically, so `config(...)` /
 * `env(...)` / `now()` are NOT allowed as attribute values.
 *
 * For runtime-conditional registration (e.g. "only enable when
 * Redis is the cache driver"), use the {@see self::$condition}
 * field: it names a static method on the check class that returns
 * `bool`. The discoverer calls that method at boot; the check is
 * only registered if it returns `true`.
 *
 * ## Anatomy
 *
 * ```php
 * use Academorix\Health\Attributes\AsHealthCheck;
 * use Academorix\Health\Enums\HealthNotificationChannel;
 * use Spatie\Health\Checks\Check;
 * use Spatie\Health\Checks\Result;
 *
 * #[AsHealthCheck(
 *     name:     'pgvector',
 *     label:    'pgvector extension',
 *     schedule: '5 * * * *',                                 // every 5 min
 *     channel:  HealthNotificationChannel::SlackPlatformEng,
 *     condition: 'shouldRun',                                // optional gate
 * )]
 * final class PgVectorHealthCheck extends Check
 * {
 *     public static function shouldRun(): bool
 *     {
 *         return DB::connection()->getDriverName() === 'pgsql';
 *     }
 *
 *     public function run(): Result
 *     {
 *         // ...
 *         return Result::make()->ok();
 *     }
 * }
 * ```
 *
 * ## Fields
 *
 *  - **name**: Unique dot-separated identifier — used as the
 *    dashboard slug and the notification "which check failed" tag.
 *    Convention: `<domain>.<subsystem>[.<detail>]`, e.g. `ai.pgvector`,
 *    `cache.redis.primary`, `queue.horizon.supervisor`.
 *
 *  - **label**: Human-readable label rendered on the dashboard.
 *    Defaults to a title-cased version of the name.
 *
 *  - **schedule**: Cron expression controlling how often the check
 *    runs. Defaults to Spatie's built-in "every minute". Bump this
 *    for expensive checks (`5 * * * *` = every 5 min, `0 * * * *` =
 *    hourly) so the health surface never becomes a hot spot.
 *
 *  - **enabled**: Static toggle — set to `false` to skip
 *    registration entirely. Useful when a check is being staged
 *    behind a feature branch or is only relevant on some
 *    environments. For runtime-conditional gating, use {@see self::$condition}.
 *
 *  - **channel**: Which logical notification channel to route
 *    failures to. Packages declare a channel enum case, apps map
 *    the case → concrete Slack webhook / PagerDuty service via
 *    config (see {@see \Academorix\Health\Support\HealthNotificationConfig}).
 *    Left `null` to opt out of routing (check still shows on the
 *    dashboard, just no push notification).
 *
 *  - **condition**: Name of a `public static` method on the same
 *    class that returns `bool`. Called once during boot. When it
 *    returns `false`, the check is not registered. Use this for
 *    environment-specific or config-dependent gating.
 *
 * ## Discovery invariants
 *
 * The discoverer enforces the following at boot. Violating any
 * throws {@see \InvalidArgumentException} — loud + fast:
 *
 *  - Target class MUST extend {@see \Spatie\Health\Checks\Check}.
 *  - Names MUST be unique across every discovered check.
 *  - `condition` (if set) MUST reference an existing `public static`
 *    method returning `bool` on the target class.
 *  - `schedule` (if set) MUST be a valid cron expression parseable
 *    by Laravel's scheduler.
 *
 * @see \Academorix\Health\Support\HealthCheckDiscoverer  Consumes this attribute.
 * @see \Academorix\Health\Enums\HealthNotificationChannel Routing target.
 * @see https://spatie.be/docs/laravel-health Documentation for the base Check class.
 */

declare(strict_types=1);

namespace Academorix\Health\Attributes;

use Academorix\Health\Enums\HealthNotificationChannel;
use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsHealthCheck
{
    /**
     * @param string $name Unique dot-separated check identifier.
     * @param string|null $label Display label. Defaults to a
     *   title-cased version of {@see $name}.
     * @param string|null $schedule Cron expression. `null` = Spatie's
     *   default (every minute). Use a coarser cadence for expensive
     *   checks (`5 * * * *`, `0 * * * *`, …).
     * @param bool $enabled Static disable switch. Prefer
     *   {@see $condition} for runtime-conditional gating.
     * @param HealthNotificationChannel|null $channel Logical
     *   notification channel. Apps resolve this to a concrete
     *   notifiable via
     *   {@see \Academorix\Health\Support\HealthNotificationConfig}.
     *   `null` = check appears on the dashboard but sends no push.
     * @param string|null $condition Name of a `public static`
     *   `bool`-returning method on the target class. Called at
     *   boot to decide whether to register the check. `null` =
     *   always register (subject to {@see $enabled}).
     */
    public function __construct(
        public string $name,
        public ?string $label = null,
        public ?string $schedule = null,
        public bool $enabled = true,
        public ?HealthNotificationChannel $channel = null,
        public ?string $condition = null,
    ) {
    }
}
