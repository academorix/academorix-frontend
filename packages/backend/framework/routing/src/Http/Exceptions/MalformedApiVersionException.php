<?php

/**
 * @file packages/routing/src/Http/Exceptions/MalformedApiVersionException.php
 *
 * @description
 * HTTP 400 — the client asked for an API version whose STRING SHAPE
 * couldn't be parsed. Distinct from
 * {@see UnsupportedApiVersionException} which fires when the shape
 * is valid but the version isn't on the endpoint's allowlist.
 *
 * ## When this fires
 *
 *   - `Accept: application/vnd.api+json; version=vX.Y.oops` — the
 *     matched `version=...` param can't be parsed by
 *     {@see \Academorix\Routing\Services\VersionComparator::parse()}.
 *   - `X-API-Version: foo` — header present but not a version string.
 *   - `?api_version=1.0.0-alpha` — query parameter with a
 *     pre-release / metadata segment we don't accept.
 *
 * ## Contract
 *
 * Extends {@see AcademorixException} so the framework Handler
 * renders it as RFC 7807 problem-details with correlation id,
 * category (`Validation`), severity (`Info`), and machine-readable
 * `error.code`.
 *
 * @see UnsupportedApiVersionException 406 — shape ok, version not
 *      supported here.
 * @see SunsetApiVersionException      410 — endpoint retired.
 */

declare(strict_types=1);

namespace Academorix\Routing\Http\Exceptions;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

final class MalformedApiVersionException extends AcademorixException
{
    /**
     * Stable machine-readable code exposed on the wire as
     * `error.code`. Clients that auto-retry with a different
     * version format branch on this literal — treat as public API.
     */
    public const CODE = 'routing.api_version.malformed';

    /**
     * Class-level translation key. The key doesn't exist in the
     * exceptions package's lang files yet — we ship a per-throw
     * `withUserMessage()` as fallback so the client sees a real
     * sentence even without translation coverage.
     */
    public const TRANSLATION_KEY = 'exceptions::http.malformed_api_version';

    /**
     * `Validation` — this is a shape-level rejection sibling to
     * unsupported Content-Type. Grouped there for dashboarding.
     */
    protected ErrorCategory $category = ErrorCategory::Validation;

    /**
     * `Info` — client-side bug, never pageable.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * 400 — the request itself is unparseable at the version-negotiation
     * layer.
     */
    protected int $httpStatus = Response::HTTP_BAD_REQUEST;

    /**
     * Named factory: `$raw` is echoed in structured context so
     * operators can grep logs to find the offending clients. The
     * user-facing message names the raw value so integrators can
     * fix their code without opening a support ticket.
     *
     * @param  string  $raw     The offending version string as the
     *                          client sent it.
     * @param  string  $source  Which negotiation channel supplied it
     *                          (`header` / `query` / `accept` / `path`).
     */
    public static function forRaw(string $raw, string $source): self
    {
        return static::make(sprintf('Malformed API version "%s" from %s.', $raw, $source))
            ->withContext(['raw' => $raw, 'source' => $source])
            ->withUserMessage(sprintf(
                'The API version "%s" is not a valid version string. Expected "vN", "vN.M", or "vN.M.P".',
                $raw,
            ));
    }
}
