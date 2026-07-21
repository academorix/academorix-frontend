<?php

/**
 * @file packages/exceptions/src/Http/UnsupportedMediaTypeException.php
 *
 * @description
 * HTTP 415 — request `Content-Type` is not one the endpoint accepts.
 * A shape-level rejection: the body was structurally illegal before
 * validation ran.
 *
 * ## Named factory
 *
 * {@see accepted()} populates context with the list of `accepted`
 * types + the actual `received` type so debugging is one grep away.
 *
 * ## Translation key
 *
 *   exceptions::http.unsupported_media_type
 *
 * @see \Stackra\Exceptions\Exception  Base class.
 * @see PayloadTooLargeException  Sibling class for the size-guard failure mode.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Http;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class UnsupportedMediaTypeException extends Exception
{
    /**
     * Machine-readable code — treat as public API. Clients that
     * pick between JSON / multipart bodies branch on this literal.
     */
    public const CODE = 'http.unsupported_media_type';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → unsupported_media_type`.
     */
    public const TRANSLATION_KEY = 'exceptions::http.unsupported_media_type';

    /**
     * `Info` severity — 415s are almost always a client bug or a
     * stale API-doc consumer. Never pageable.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * `Validation` category — content-type mismatches sit in the
     * same "request shape wrong" bucket as size guards and missing
     * fields.
     */
    protected ErrorCategory $category = ErrorCategory::Validation;

    /**
     * 415 — standard status for "your Content-Type isn't one we
     * accept here".
     */
    protected int $httpStatus = Response::HTTP_UNSUPPORTED_MEDIA_TYPE;

    /**
     * Named factory: attach the list of acceptable content types +
     * the one the client actually sent.
     *
     * The `accepted` list goes into context (for structured
     * dashboard grouping and to power `Accept:` header hints), and
     * gets flattened to a comma-separated string for the
     * `:accepted` translation placeholder.
     *
     * @param  list<string>  $accepted  MIME types the endpoint
     *                                  accepts, in preference
     *                                  order. Kept verbatim in
     *                                  context.
     * @param  string|null   $received  The Content-Type the client
     *                                  actually sent (or `null`
     *                                  when the header was absent
     *                                  entirely).
     * @return static The fluent instance with both fields in
     *                context and translation parameters.
     */
    public static function accepted(array $accepted, ?string $received = null): static
    {
        return static::make('Unsupported Content-Type.')
            ->withContext(['accepted' => $accepted, 'received' => $received])
            ->withTranslationParameters([
                'accepted' => implode(', ', $accepted),
                'received' => $received ?? '',
            ]);
    }
}
