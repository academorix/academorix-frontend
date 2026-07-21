<?php

/**
 * @file packages/sdk/api-sdk/src/Enums/LogLevel.php
 *
 * @description
 * Verbosity levels for the SDK's request/response logger. Read
 * once at boot from `sdk.api.logging.level`; can be overridden
 * per-connector-instance for one-off debugging sessions.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Enums;

use Stackra\Enum\Enum;

/**
 * How much the SDK emits to the configured log channel.
 */
enum LogLevel: string
{
    use Enum;

    /**
     * Never log SDK traffic. Recommended for production unless
     * a specific incident requires deep tracing.
     */
    case Off = 'off';

    /**
     * Log only failed requests (4xx, 5xx, network errors).
     * Payloads are redacted per the config's `redact` list.
     */
    case Errors = 'errors';

    /**
     * Log every request + response with method / URL / status /
     * duration. Payloads are redacted. Use for local debugging;
     * enabling in production requires confirming redaction covers
     * every PII surface.
     */
    case All = 'all';
}
