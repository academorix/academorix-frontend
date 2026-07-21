<?php

/**
 * @file packages/exceptions/src/Enums/ErrorSeverity.php
 *
 * @description
 * Log-level severity aligned with PSR-3. Every {@see
 * \Stackra\Exceptions\Exception} declares a severity that
 * drives:
 *
 *   - The PSR-3 log level a reporter emits (`Log::log($severity->psr(), ...)`).
 *   - The Sentry level tag attached to the event.
 *   - Whether the JSON renderer masks the underlying `$e->getMessage()`
 *     from the client (severity >= error hides the raw message in
 *     production).
 *
 * We deliberately don't use PSR-3 strings directly — an enum gives
 * IDE autocomplete + phpstan level 8 checks and lets us add domain-
 * specific severities (e.g. `Alert`) without stringly-typing.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Enums;

use Psr\Log\LogLevel;
use Stackra\Enum\Enum;

enum ErrorSeverity: string
{
    use Enum;

    case Debug = 'debug';
    case Info = 'info';
    case Notice = 'notice';
    case Warning = 'warning';
    case Error = 'error';
    case Critical = 'critical';
    case Alert = 'alert';
    case Emergency = 'emergency';

    /** Mapping to PSR-3 log level constants. */
    public function psr(): string
    {
        return match ($this) {
            self::Debug => LogLevel::DEBUG,
            self::Info => LogLevel::INFO,
            self::Notice => LogLevel::NOTICE,
            self::Warning => LogLevel::WARNING,
            self::Error => LogLevel::ERROR,
            self::Critical => LogLevel::CRITICAL,
            self::Alert => LogLevel::ALERT,
            self::Emergency => LogLevel::EMERGENCY,
        };
    }

    /**
     * Whether the JSON renderer should mask `getMessage()` when the app
     * is running in a production-like env. `error` and above hide the
     * raw message; the userMessage takes over.
     */
    public function shouldMaskMessageInProd(): bool
    {
        return match ($this) {
            self::Error, self::Critical, self::Alert, self::Emergency => true,
            default => false,
        };
    }
}
