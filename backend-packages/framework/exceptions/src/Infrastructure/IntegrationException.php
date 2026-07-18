<?php

/**
 * @file packages/exceptions/src/Infrastructure/IntegrationException.php
 *
 * @description
 * HTTP 502 — a third-party integration returned an error. Captures
 * upstream identity + status + payload snapshot so on-call can
 * distinguish "Stripe is down" from "our request to Stripe was
 * malformed".
 *
 * ## Fluent usage
 *
 *   throw IntegrationException::upstream('stripe', 502, ['id' => 'ch_x'])
 *       ->withUserMessage('Payment provider is temporarily unavailable.');
 *
 * The `payload` snapshot is run through the masker before shipping
 * to logs / Sentry, so it's safe to pass response bodies verbatim.
 *
 * ## Translation keys
 *
 *   exceptions::infrastructure.upstream_error        (class default)
 *   exceptions::infrastructure.upstream_error_named  ({@see upstream()})
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see TimeoutException  Subclass for the "took too long" flavour.
 * @see ServiceUnavailableException  Sibling class for INTERNAL dependency outages.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Infrastructure;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class IntegrationException extends AcademorixException
{
    /**
     * Machine-readable code — clients that special-case third-party
     * outages (e.g. retry-with-backoff, fallback provider) branch
     * on this literal. Treat as public API.
     */
    public const CODE = 'integration.upstream_error';

    /**
     * Class-level translation key pointing at
     * `lang/en/infrastructure.php → upstream_error`. Named
     * factories override with more specific keys that carry the
     * service name.
     */
    public const TRANSLATION_KEY = 'exceptions::infrastructure.upstream_error';

    /**
     * `Error` severity — third-party outages should surface on
     * dashboards but rarely page directly (vendors have their own
     * on-call). Bump to `Critical` at the callsite for
     * revenue-critical integrations like payments.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Error;

    /**
     * `Integration` category — distinguishes third-party failures
     * from internal-dependency outages
     * ({@see ServiceUnavailableException}). Dashboards route these
     * to a "vendor status" panel.
     */
    protected ErrorCategory $category = ErrorCategory::Integration;

    /**
     * 502 — the standard "bad gateway / upstream returned an error"
     * status. Subclasses like {@see TimeoutException} switch to 504.
     */
    protected int $httpStatus = Response::HTTP_BAD_GATEWAY;

    /**
     * Named factory: capture an upstream failure.
     *
     * `$service` is the integration identifier ("stripe", "openai",
     * "twilio") — must be stable across releases so dashboards
     * group correctly. `$upstreamStatus` is the raw HTTP status
     * the upstream returned (may be null for non-HTTP failures like
     * a SDK panic).
     *
     * @param  string                $service         Stable integration
     *                                                identifier ("stripe",
     *                                                "openai"). MUST NOT
     *                                                drift across
     *                                                releases —
     *                                                dashboards key off
     *                                                this literal.
     * @param  int|null              $upstreamStatus  HTTP status the
     *                                                upstream returned, or
     *                                                `null` for non-HTTP
     *                                                failures.
     * @param  array<string, mixed>  $payload         Snapshot of the
     *                                                upstream response —
     *                                                masked by the
     *                                                Redactor before
     *                                                shipping to logs /
     *                                                Sentry.
     * @param  Throwable|null        $previous        Underlying exception
     *                                                (Guzzle, SDK) —
     *                                                preserved as
     *                                                `$previous` so
     *                                                Ignition / Sentry
     *                                                still see the real
     *                                                trace.
     * @return static The fluent instance with the service name in
     *                context and translation parameters, plus the
     *                more specific `upstream_error_named`
     *                translation key.
     */
    public static function upstream(
        string $service,
        ?int $upstreamStatus = null,
        array $payload = [],
        ?Throwable $previous = null,
    ): static {
        return static::make("Upstream service [{$service}] returned an error.", $previous)
            ->withContext([
                'service' => $service,
                'upstream_status' => $upstreamStatus,
                'payload' => $payload,
            ])
            ->withTranslationParameters(['service' => $service])
            ->withTranslationKey('exceptions::infrastructure.upstream_error_named');
    }
}
