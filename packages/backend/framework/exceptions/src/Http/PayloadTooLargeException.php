<?php

/**
 * @file packages/exceptions/src/Http/PayloadTooLargeException.php
 *
 * @description
 * HTTP 413 — request body exceeds an app-level size guard (a
 * `FormRequest` rule or a service check). Distinct from PHP's own
 * `post_max_size` / nginx's `client_max_body_size` rejection: those
 * never enter PHP, so this class is thrown only from userland guards.
 *
 * ## Context
 *
 * `limit_bytes` and `actual_bytes` are surfaced in context so
 * dashboards can plot upload-size distributions and detect abusive
 * clients.
 *
 * ## Translation key
 *
 *   exceptions::http.payload_too_large
 *
 * @see \Stackra\Exceptions\Exception  Base class.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Http;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class PayloadTooLargeException extends Exception
{
    /**
     * Machine-readable code exposed as `error.code`. Clients that
     * offer a "retry with smaller upload" affordance branch on this
     * literal.
     */
    public const CODE = 'http.payload_too_large';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → payload_too_large`.
     */
    public const TRANSLATION_KEY = 'exceptions::http.payload_too_large';

    /**
     * `Info` severity — clients hit size limits routinely and it's
     * not an ops concern.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * `Validation` category — a size limit is a shape guard on the
     * incoming body, in the same bucket as "unsupported media type"
     * or "missing required field".
     */
    protected ErrorCategory $category = ErrorCategory::Validation;

    /**
     * 413 — the standard status for "your body was too big". Kept
     * as an instance property so callers can bump to 422 in rare
     * flows where the request is a partial upload.
     */
    protected int $httpStatus = Response::HTTP_REQUEST_ENTITY_TOO_LARGE;

    /**
     * Named factory: the request was `$actualBytes` bytes but the
     * endpoint only accepts up to `$limitBytes`.
     *
     * Both sizes are echoed via translation parameters so a locale
     * can render "You sent 12 MB but the limit is 5 MB" if it
     * wants. The raw byte counts also flow into context so the JSON
     * renderer can surface them under `meta.context` for API
     * clients.
     *
     * @param  int  $limitBytes   Endpoint's declared maximum body
     *                            size in bytes.
     * @param  int  $actualBytes  Actual size of the incoming body.
     * @return static The fluent instance carrying both sizes in
     *                context and translation parameters.
     */
    public static function withLimit(int $limitBytes, int $actualBytes): static
    {
        return static::make("Payload {$actualBytes}b exceeds limit {$limitBytes}b.")
            ->withContext(['limit_bytes' => $limitBytes, 'actual_bytes' => $actualBytes])
            ->withTranslationParameters([
                'limit_bytes' => $limitBytes,
                'actual_bytes' => $actualBytes,
            ]);
    }
}
