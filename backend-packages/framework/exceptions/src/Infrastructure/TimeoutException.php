<?php

/**
 * @file packages/exceptions/src/Infrastructure/TimeoutException.php
 *
 * @description
 * HTTP 504 — an internal or upstream call blew its budget. Preferred
 * over bubbling the raw Guzzle / PDO / Redis timeout so the caller
 * gets a stable code they can retry on.
 *
 * ## Severity
 *
 * `Warning` (not `Error`) — timeouts are expected in a distributed
 * system. A spike should surface on dashboards without paging.
 *
 * ## Translation keys
 *
 *   exceptions::infrastructure.timeout        (class default)
 *   exceptions::infrastructure.timeout_named  ({@see afterSeconds()})
 *
 * @see IntegrationException  Parent class — this subclass keeps the
 *                            `Integration` category but switches
 *                            status + severity for the timeout case.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Infrastructure;

use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class TimeoutException extends IntegrationException
{
    /**
     * Distinct machine-readable code from the generic upstream
     * error — clients that implement retry-with-backoff branch on
     * this literal specifically. Treat as public API.
     */
    public const CODE = 'integration.timeout';

    /**
     * Class-level translation key pointing at
     * `lang/en/infrastructure.php → timeout`. The
     * {@see afterSeconds()} factory overrides with the named
     * variant that includes the service name in the message.
     */
    public const TRANSLATION_KEY = 'exceptions::infrastructure.timeout';

    /**
     * `Warning` severity — a single timeout is expected system
     * noise; alerts fire on rate, not per throw.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * 504 — the standard "upstream took too long" status. Distinct
     * from the parent's 502 ("upstream returned error") so clients
     * can implement smarter retry strategies for each.
     */
    protected int $httpStatus = Response::HTTP_GATEWAY_TIMEOUT;

    /**
     * Named factory: identify which service and how long we waited.
     *
     * `$seconds` is the wall-clock budget that was exceeded (not
     * necessarily the exact time we waited — which may be less if
     * the guard fired preemptively).
     *
     * @param  string  $service  Stable integration identifier —
     *                           must match the label used by
     *                           {@see IntegrationException::upstream()}
     *                           so dashboards group correctly.
     * @param  float   $seconds  Budget that was exceeded, in
     *                           fractional seconds. Interpolated
     *                           into the user-facing message via
     *                           the `:seconds` placeholder.
     * @return static The fluent instance carrying both fields in
     *                context and translation parameters, with the
     *                more specific `timeout_named` translation key
     *                applied.
     */
    public static function afterSeconds(string $service, float $seconds): static
    {
        return static::make("Timed out calling [{$service}] after {$seconds}s.")
            ->withContext(['service' => $service, 'timeout_seconds' => $seconds])
            ->withTranslationParameters(['service' => $service, 'seconds' => $seconds])
            ->withTranslationKey('exceptions::infrastructure.timeout_named');
    }
}
