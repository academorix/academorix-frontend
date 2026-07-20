<?php

/**
 * @file packages/foundation/src/Middleware/AssignCorrelationId.php
 *
 * @description
 * Reads `X-Request-Id` (or `X-Correlation-Id`) from the inbound
 * request, mints a fresh ULID if neither is present, and stashes it
 * onto:
 *
 *   1. The request attributes (`$request->attributes->get('correlation_id')`).
 *   2. The static accessor {@see CorrelationId::current()}.
 *   3. The response headers, so the caller can echo the id back on
 *      support tickets and see the same value in their APM.
 *
 * MUST run early in the middleware pipeline — before anything that
 * logs, throws, or dispatches a job. Register via
 * `$middleware->api(prepend: [AssignCorrelationId::class])` in
 * `bootstrap/app.php`.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Middleware;

use Academorix\Foundation\Support\CorrelationId;
use Academorix\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

#[AsMiddleware(alias: 'correlation-id', groups: [], priority: 5)]
final class AssignCorrelationId
{
    /**
     * Chars we allow through when trusting an inbound id. Everything
     * else gets a fresh ULID minted instead so a hostile client
     * can't inject header-splitting payloads.
     */
    private const INBOUND_PATTERN = '/^[A-Za-z0-9\-_.]{1,128}$/';

    public function handle(Request $request, Closure $next): Response
    {
        $id = $this->resolve($request);

        $request->attributes->set('correlation_id', $id);
        $request->headers->set(CorrelationId::HEADER, $id);
        CorrelationId::set($id);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set(CorrelationId::HEADER, $id);

        return $response;
    }

    private function resolve(Request $request): string
    {
        $inbound = $request->headers->get(CorrelationId::HEADER)
            ?? $request->headers->get(CorrelationId::HEADER_FALLBACK);

        if (is_string($inbound) && preg_match(self::INBOUND_PATTERN, $inbound) === 1) {
            return $inbound;
        }

        return CorrelationId::generate();
    }
}
