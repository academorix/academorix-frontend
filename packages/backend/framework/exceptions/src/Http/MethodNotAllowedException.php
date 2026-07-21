<?php

/**
 * @file packages/exceptions/src/Http/MethodNotAllowedException.php
 *
 * @description
 * HTTP 405 — the route exists but the HTTP verb the client sent is
 * not bound. The mapper builds this from Symfony's
 * `MethodNotAllowedHttpException` so `context()` carries the list of
 * verbs the route DOES accept, which the JSON renderer echoes back
 * as an `Allow:` header per RFC 9110 §15.5.6.
 *
 * ## Translation key
 *
 *   exceptions::http.method_not_allowed
 *
 * @see \Stackra\Exceptions\StackraException  Base class.
 * @see \Stackra\Exceptions\Support\ExceptionMapper  Adapter that
 *      converts Symfony's exception into this class.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Http;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class MethodNotAllowedException extends StackraException
{
    /**
     * Stable machine-readable code. Clients that offer a "try the
     * other verb" affordance branch on this literal — treat as
     * public API.
     */
    public const CODE = 'http.method_not_allowed';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → method_not_allowed`.
     */
    public const TRANSLATION_KEY = 'exceptions::http.method_not_allowed';

    /**
     * `Info` severity — a 405 is almost always a client bug
     * (probing / stale docs) and not something on-call needs to
     * see.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * Uses `NotFound` bucket rather than `Validation` — for
     * dashboards, "wrong verb on a real route" is closer to
     * "resource missing" than to "invalid body". Clients treat both
     * as routing problems.
     */
    protected ErrorCategory $category = ErrorCategory::NotFound;

    /**
     * 405 — the correct status for "route exists, verb doesn't".
     * Must be paired with an `Allow:` header per RFC 9110; the
     * renderer builds that header from `context.allowed`.
     */
    protected int $httpStatus = Response::HTTP_METHOD_NOT_ALLOWED;

    /**
     * Named factory carrying the list of verbs that WOULD have
     * matched the route.
     *
     * The list goes into context as-is (for the `Allow:` header
     * builder) and is joined with `, ` for the `:allowed`
     * translation placeholder — clients that show the verb list to
     * the user get a human-readable string.
     *
     * @param  list<string>  $allowed  Uppercase HTTP verbs that the
     *                                 route accepts. Order is
     *                                 preserved for the header.
     * @return static The fluent instance carrying the allowed-verbs
     *                list in both context and translation
     *                parameters.
     */
    public static function with(array $allowed): static
    {
        return static::make('The HTTP method is not allowed on this route.')
            ->withContext(['allowed' => $allowed])
            ->withTranslationParameters(['allowed' => implode(', ', $allowed)]);
    }
}
