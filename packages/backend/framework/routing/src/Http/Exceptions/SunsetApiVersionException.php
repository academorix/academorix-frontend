<?php

/**
 * @file packages/routing/src/Http/Exceptions/SunsetApiVersionException.php
 *
 * @description
 * HTTP 410 — the caller hit an endpoint whose {@see Sunsets} date
 * has passed AND the app is configured to enforce sunsets. Only
 * fires when `config('api-versioning.enforce_sunsets') === true`;
 * with enforcement off, the middleware just emits the `Sunset`
 * header and lets the request through.
 *
 * ## Why 410 (and not 404 / 400)
 *
 * 410 Gone is the RFC 7231 status specifically for "this used to
 * exist, we deliberately removed it". Callers reading the code
 * literal know retrying won't help — this is DIFFERENT from 404
 * (which is retryable / transient in principle).
 *
 * ## Response headers
 *
 * The renderer also attaches:
 *
 *   - `Sunset: <http-date>` — from the attribute's `date`.
 *   - `Link: <successor-url>; rel="successor-version"` — when
 *     the attribute supplied a `replacedBy`.
 *
 * Both are emitted by the response emitter (out of scope here)
 * from the same {@see Sunsets} metadata that populated this
 * exception's context.
 *
 * @see \Stackra\Routing\Attributes\Sunsets
 * @see UnsupportedApiVersionException 406 — version not on
 *      allowlist (never was supported here).
 * @see MalformedApiVersionException  400 — version unparseable.
 */

declare(strict_types=1);

namespace Stackra\Routing\Http\Exceptions;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

final class SunsetApiVersionException extends Exception
{
    /** Stable public code. */
    public const CODE = 'routing.api_version.sunset';

    public const TRANSLATION_KEY = 'exceptions::http.sunset_api_version';

    /**
     * `NotFound` category — the endpoint semantically no longer
     * exists. Grouped with "resource gone" dashboards, not with
     * validation.
     */
    protected ErrorCategory $category = ErrorCategory::NotFound;

    /**
     * `Notice` — one step above `Info`. Sunset hits are worth
     * looking at even if they're not pageable: they tell us how
     * many callers still haven't migrated.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Notice;

    /** 410 Gone — the deliberate-removal status. */
    protected int $httpStatus = Response::HTTP_GONE;

    /**
     * @param  string      $requested   Version the caller used.
     * @param  string      $sunsetDate  ISO-8601 date the endpoint was retired.
     * @param  string|null $replacedBy  Successor version, when advertised.
     */
    public static function forRequested(
        string $requested,
        string $sunsetDate,
        ?string $replacedBy = null,
    ): self {
        $userMessage = $replacedBy !== null
            ? sprintf(
                'API version "%s" was retired on %s. Please migrate to %s.',
                $requested,
                $sunsetDate,
                $replacedBy,
            )
            : sprintf(
                'API version "%s" was retired on %s.',
                $requested,
                $sunsetDate,
            );

        return static::make(sprintf(
            'API version "%s" is past its sunset date (%s).',
            $requested,
            $sunsetDate,
        ))
            ->withContext([
                'requested' => $requested,
                'sunset_date' => $sunsetDate,
                'replaced_by' => $replacedBy,
            ])
            ->withUserMessage($userMessage);
    }
}
