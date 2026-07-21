<?php

declare(strict_types=1);

namespace Stackra\Exceptions\Contracts;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Contract for classes that render a `\Throwable` into an HTTP
 * response. Multiple formatters are registered with the exception
 * handler and iterated in priority order; the first formatter whose
 * {@see canFormat()} returns `true` wins.
 *
 * Formatters must be pure functions of the (request, throwable) pair
 * — no static state, no request-scoped mutation. This keeps them
 * safe to reuse under Octane and other long-lived runtimes.
 *
 * Shipped implementations:
 *
 *   - {@see \Stackra\Exceptions\Formatters\JsonErrorFormatter}
 *     — RFC 7807-flavoured envelope for API clients.
 *   - {@see \Stackra\Exceptions\Formatters\HtmlErrorFormatter}
 *     — Blade-rendered pages for browser navigation.
 *
 * Applications can register their own by tagging them
 * `stackra.exception.formatters` in the container:
 *
 *     $this->app->tag(MyFormatter::class, 'stackra.exception.formatters');
 *
 * The tag is drained by the {@see \Stackra\Exceptions\Handler}
 * at boot time.
 */
interface ErrorFormatterInterface
{
    /**
     * Whether this formatter is applicable to the incoming request.
     * Called for every formatter until one returns `true`.
     */
    public function canFormat(Request $request): bool;

    /**
     * Render the throwable as an HTTP response. Guaranteed to be
     * called only after {@see canFormat()} returned `true`, so this
     * method may assume the request shape is compatible.
     */
    public function format(Request $request, Throwable $e): Response;

    /**
     * Priority used to sort formatters in the container. Higher
     * priority runs first. Convention: use multiples of 10 so
     * downstream apps can wedge custom formatters between the
     * shipped ones without renumbering.
     */
    public function priority(): int;
}
