<?php

/**
 * @file packages/exceptions/src/Infrastructure/MaintenanceModeException.php
 *
 * @description
 * HTTP 503 — the app is deliberately in maintenance mode (e.g. via
 * `php artisan down`). Subclass of {@see ServiceUnavailableException}
 * so anything catching the parent still handles it, but with a
 * distinct code so clients can show a maintenance-specific screen
 * (calendar link, ETA, etc.).
 *
 * Emitted when the mapper sees a
 * `Symfony\Component\HttpKernel\Exception\HttpException` with status
 * 503 AND `app()->isDownForMaintenance()` returns true.
 *
 * ## Translation key
 *
 *   exceptions::infrastructure.maintenance
 *
 * @see ServiceUnavailableException  Parent class.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Infrastructure;

class MaintenanceModeException extends ServiceUnavailableException
{
    /**
     * Distinct machine-readable code — clients that show a
     * maintenance-specific screen (with ETAs, status page links)
     * branch on this literal. Treat as public API.
     */
    public const CODE = 'infrastructure.maintenance';

    /**
     * Class-level translation key pointing at
     * `lang/en/infrastructure.php → maintenance`. The copy is
     * intentionally distinct from the generic `unavailable` string
     * so users see "we're doing planned work" rather than
     * "something is broken".
     */
    public const TRANSLATION_KEY = 'exceptions::infrastructure.maintenance';

    /**
     * Named factory: scheduled maintenance with an optional retry
     * hint.
     *
     * If `$retryAfter` is null, the parent's default (30s) applies.
     * Callers with a firm ETA should pass a concrete number so the
     * client can show a countdown / retry precisely.
     *
     * @param  int|null  $retryAfter  Retry-after hint in whole
     *                                seconds. Echoed as both the
     *                                `Retry-After:` header and the
     *                                `error.retryAfter` body field.
     *                                Pass `null` to inherit the
     *                                parent's 30-second default.
     * @return static The fluent instance ready to be thrown.
     */
    public static function scheduled(?int $retryAfter = null): static
    {
        $instance = static::make('Application is in maintenance mode.');

        if ($retryAfter !== null) {
            $instance = $instance->withRetryAfter($retryAfter);
        }

        return $instance;
    }
}
