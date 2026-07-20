<?php

/**
 * @file packages/exceptions/src/Http/TooManyRequestsException.php
 *
 * @description
 * HTTP 429 — request rejected by a rate limiter. Carries `retryAfter`
 * so clients can back off deterministically. The JSON renderer
 * echoes the value as both a `Retry-After` header (RFC 9110 §10.2.3)
 * and an `error.retryAfter` body field, giving clients on both
 * fetch APIs and legacy XMLHttpRequest paths access to it.
 *
 * ## Severity
 *
 * `Notice` — one step above `Info`. 429s are expected but a sudden
 * spike is a signal worth surfacing on dashboards, without paging.
 *
 * ## Translation key
 *
 *   exceptions::http.too_many_requests
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class exposing `withRetryAfter()`.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class TooManyRequestsException extends AcademorixException
{
    /**
     * Machine-readable code — clients that implement adaptive
     * back-off branch on this literal. Treat as public API.
     */
    public const CODE = 'http.too_many_requests';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → too_many_requests`. The factory does NOT
     * override — every 429 shares one client-facing string.
     */
    public const TRANSLATION_KEY = 'exceptions::http.too_many_requests';

    /**
     * `Notice` severity — a single 429 is expected traffic, but the
     * volume matters. Dashboards should chart the rate; alerts
     * fire on unusual spikes, not per throw.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Notice;

    /**
     * Dedicated `RateLimit` category — separate from `Validation` /
     * `Business` so dashboards can chart throttle activity in one
     * panel across every limiter.
     */
    protected ErrorCategory $category = ErrorCategory::RateLimit;

    /**
     * Standard 429 status. The renderer pairs this with a
     * `Retry-After:` header sourced from
     * {@see AcademorixException::retryAfter()}.
     */
    protected int $httpStatus = Response::HTTP_TOO_MANY_REQUESTS;

    /**
     * Named factory: attach the retry-after hint (in seconds) and
     * optionally the limiter name that fired.
     *
     * NOTE: the method is deliberately NOT called `withRetryAfter()`
     * — that would shadow the parent's fluent instance setter of
     * the same name (which takes a nullable int only). Using a
     * distinct name (`exceeded`) also reads better at the callsite:
     *
     *     throw TooManyRequestsException::exceeded(30, 'api');
     *
     * The limiter name is useful in context (log grouping,
     * dashboards) but not exposed in the user message — clients
     * don't need to know which internal limiter fired.
     *
     * @param  int          $seconds   Retry-after hint in whole
     *                                 seconds. Echoed both as the
     *                                 `Retry-After:` header and the
     *                                 `error.retryAfter` body
     *                                 field.
     * @param  string|null  $limiter   Internal limiter identifier
     *                                 for dashboard grouping
     *                                 ("api", "login",
     *                                 "password-reset"). Null when
     *                                 the caller doesn't care.
     * @return static The fluent instance with retry-after set and
     *                the limiter name in context + translation
     *                parameters.
     */
    public static function exceeded(int $seconds, ?string $limiter = null): static
    {
        return static::make("Rate limit exceeded for limiter [{$limiter}].")
            ->withContext(['limiter' => $limiter])
            ->withRetryAfter($seconds)
            ->withTranslationParameters(['seconds' => $seconds]);
    }
}
