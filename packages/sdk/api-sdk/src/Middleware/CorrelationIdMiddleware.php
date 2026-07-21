<?php

/**
 * @file packages/sdk/api-sdk/src/Middleware/CorrelationIdMiddleware.php
 *
 * @description
 * Stamps every outbound SDK request with the current
 * correlation id (read from
 * {@see \Stackra\Foundation\Support\CorrelationId}). `apps/api`'s
 * inbound correlation-id middleware picks up the header,
 * threads the same id through its own logs, and echoes it back
 * on the response — so log aggregation joins the two sides
 * seamlessly.
 *
 * ## When there's no active correlation id
 *
 * The middleware is a no-op — no header is added. That happens
 * mostly in queue workers where the job's own correlation id
 * hasn't been restored yet. Consumers that want to force an id
 * (e.g. cross-tenant admin jobs) can call
 * `CorrelationId::assign(...)` before dispatching the SDK call.
 *
 * ## Header name
 *
 * `X-Correlation-ID` by default; configurable via
 * `sdk.api.correlation_id.header`.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Middleware;

use Stackra\Foundation\Support\CorrelationId;
use Saloon\Http\PendingRequest;

/**
 * Request-side middleware — stamps the correlation-id header.
 */
final readonly class CorrelationIdMiddleware
{
    /**
     * @param  string  $header  Header name, e.g. `X-Correlation-ID`.
     */
    public function __construct(
        private string $header,
    ) {
    }

    /**
     * Saloon invokes this via `middleware()->onRequest($this, ...)`.
     */
    public function __invoke(PendingRequest $pendingRequest): PendingRequest
    {
        $id = self::currentCorrelationId();

        if ($id !== null && $id !== '') {
            $pendingRequest->headers()->add($this->header, $id);
        }

        return $pendingRequest;
    }

    /**
     * Look up the current correlation id. Extracted as a static
     * so tests can override via a substituted CorrelationId
     * class alias without needing to construct the middleware.
     *
     * Returns `null` when no id is bound (queue workers, CLI
     * commands that haven't opted in).
     */
    private static function currentCorrelationId(): ?string
    {
        if (! class_exists(CorrelationId::class)) {
            return null;
        }

        // The CorrelationId facade exposes `current()` as its
        // read accessor — see the foundation package.
        return method_exists(CorrelationId::class, 'current')
            ? CorrelationId::current()
            : null;
    }
}
