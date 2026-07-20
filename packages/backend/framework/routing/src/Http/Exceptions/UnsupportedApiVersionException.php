<?php

/**
 * @file packages/routing/src/Http/Exceptions/UnsupportedApiVersionException.php
 *
 * @description
 * HTTP 406 — the client asked for a valid-shaped version that this
 * endpoint does not serve. Distinct from
 * {@see MalformedApiVersionException} (400 — unparseable) and
 * {@see SunsetApiVersionException} (410 — endpoint retired).
 *
 * ## Why 406 (and not 400 / 404)
 *
 * 406 "Not Acceptable" is the RFC 7231 status for successful
 * content negotiation failure — we UNDERSTOOD what the client
 * asked for, we just can't produce it here. 400 would suggest the
 * request was malformed (it wasn't) and 404 would suggest the URL
 * doesn't exist (it does, just not for that version).
 *
 * ## Contract
 *
 * Structured context carries:
 *
 *   - `requested` — the version the client asked for.
 *   - `supported` — the list this endpoint DOES accept.
 *   - `source`    — how the version was communicated
 *                   (`header` / `query` / `accept` / `path`
 *                   / `default`).
 *
 * The formatter includes this in the RFC 7807 body so clients can
 * pick a valid version and retry programmatically.
 *
 * @see MalformedApiVersionException 400 — shape unparseable.
 * @see SunsetApiVersionException    410 — endpoint retired.
 */

declare(strict_types=1);

namespace Academorix\Routing\Http\Exceptions;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

final class UnsupportedApiVersionException extends AcademorixException
{
    /** Stable public code. */
    public const CODE = 'routing.api_version.unsupported';

    public const TRANSLATION_KEY = 'exceptions::http.unsupported_api_version';

    /**
     * `Validation` bucket — sibling of unsupported Content-Type,
     * which is the same shape of failure a step up the protocol.
     */
    protected ErrorCategory $category = ErrorCategory::Validation;

    /** Client bug, never pageable. */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * 406 Not Acceptable. Companion `Content-Type` negotiation
     * uses the same status by convention.
     */
    protected int $httpStatus = Response::HTTP_NOT_ACCEPTABLE;

    /**
     * @param  string        $requested  Version the client sent.
     * @param  list<string>  $supported  Allowlist advertised by
     *                                   the resolved route target.
     * @param  string        $source     Where we found the version.
     */
    public static function forRequested(string $requested, array $supported, string $source): self
    {
        return static::make(sprintf(
            'API version "%s" not supported on this endpoint (accepted: %s).',
            $requested,
            implode(', ', $supported),
        ))
            ->withContext([
                'requested' => $requested,
                'supported' => $supported,
                'source' => $source,
            ])
            ->withUserMessage(sprintf(
                'API version "%s" is not supported here. Try one of: %s.',
                $requested,
                implode(', ', $supported),
            ));
    }
}
