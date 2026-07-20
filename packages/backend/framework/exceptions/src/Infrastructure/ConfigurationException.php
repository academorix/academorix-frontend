<?php

/**
 * @file packages/exceptions/src/Infrastructure/ConfigurationException.php
 *
 * @description
 * HTTP 500 — a required config value is missing or malformed. Always
 * a deployment / secrets-management bug; severity is `Emergency` so
 * on-call gets paged immediately.
 *
 *   throw ConfigurationException::missing('services.stripe.secret');
 *
 * The renderer masks the underlying message in prod so we don't leak
 * the config key path to clients. Even in dev the value itself never
 * ships — only the key path — because the masker's key-based rules
 * catch `secret` / `api_key` substrings.
 *
 * ## Translation key
 *
 *   exceptions::infrastructure.configuration
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see ServiceUnavailableException  For runtime dependency outages
 *                                   (as opposed to boot-time
 *                                   misconfiguration).
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Infrastructure;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class ConfigurationException extends AcademorixException
{
    /**
     * Machine-readable code — reporters route this literal to the
     * "deployment / secrets" Sentry channel. Treat as public API.
     */
    public const CODE = 'infrastructure.configuration';

    /**
     * Class-level translation key pointing at
     * `lang/en/infrastructure.php → configuration`. The copy is
     * intentionally generic because the underlying config key path
     * is a bug signal for ops and has no useful meaning for the
     * user.
     */
    public const TRANSLATION_KEY = 'exceptions::infrastructure.configuration';

    /**
     * `Emergency` severity — configuration failures always page.
     * The renderer also masks the raw `getMessage()` in production
     * because of this severity level.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Emergency;

    /**
     * `Infrastructure` category — routes to the same dashboards as
     * dependency outages, since ops owns both.
     */
    protected ErrorCategory $category = ErrorCategory::Infrastructure;

    /**
     * 500 — misconfiguration is always a server bug. Never map to
     * 4xx.
     */
    protected int $httpStatus = Response::HTTP_INTERNAL_SERVER_ERROR;

    /**
     * Named factory: the config key was expected but is null / empty
     * at boot time.
     *
     * @param  string  $key  Dotted config path (e.g.
     *                       `services.stripe.secret`). Kept in
     *                       `context.config_key` for dashboards;
     *                       never echoed to end users because the
     *                       renderer masks the message on
     *                       `Emergency` severity.
     * @return static The fluent instance with the key in context.
     */
    public static function missing(string $key): static
    {
        return static::make("Configuration key [{$key}] is missing or empty.")
            ->withContext(['config_key' => $key]);
    }

    /**
     * Named factory: the config key exists but its value is invalid
     * (wrong shape, out-of-range, etc.).
     *
     * `$reason` is a developer-facing description — kept in context
     * for logs, not in the user message.
     *
     * @param  string  $key     Dotted config path — same shape as
     *                          {@see missing()}.
     * @param  string  $reason  Free-form developer-facing
     *                          description ("expected int, got
     *                          string", "value out of allowed
     *                          range"). Stored in `context.reason`.
     * @return static The fluent instance with both fields in
     *                context.
     */
    public static function invalid(string $key, string $reason): static
    {
        return static::make("Configuration key [{$key}] is invalid: {$reason}")
            ->withContext(['config_key' => $key, 'reason' => $reason]);
    }
}
