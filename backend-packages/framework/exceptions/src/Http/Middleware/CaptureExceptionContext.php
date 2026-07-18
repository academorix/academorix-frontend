<?php

/**
 * @file packages/exceptions/src/Http/Middleware/CaptureExceptionContext.php
 *
 * @description
 * Snapshots per-request metadata into a container-scoped array so
 * exceptions bubbling up from the domain layer can attach useful
 * context automatically (route, method, user id, tenant id) without
 * every handler having to pass the `Request` down manually.
 *
 * ## Consumers
 *
 * Reporters read the snapshot via
 * `app('academorix.exception_context')`:
 *
 *   - {@see \Academorix\Exceptions\Reporting\LogReporter} — merges
 *     into every structured log line.
 *   - {@see \Academorix\Exceptions\Reporting\SentryContextEnricher}
 *     — attaches as a Sentry context under `academorix.request`.
 *
 * ## Middleware placement
 *
 * Must run AFTER anything that resolves the authenticated user or
 * tenant (Sanctum auth guard, tenancy middleware), but BEFORE
 * anything that throws (validation, controllers). The
 * `exception-context` alias — registered by the Routing package's
 * `#[AsMiddleware]` discovery pass via the attribute on this
 * class — is the intended API. Attach via
 * `->middleware(['auth:sanctum', 'tenancy', 'exception-context'])`
 * on the route group.
 *
 * ## Data captured
 *
 *   - `method`         HTTP method
 *   - `path`           request path (canonical, leading slash)
 *   - `route`          named route (if any)
 *   - `ip`             client IP
 *   - `user_agent`     browser / SDK identifier
 *   - `correlation_id` from `AssignCorrelationId` middleware
 *   - `user_id`        authenticated user's primary key (if any)
 *   - `tenant_id`      resolved tenant id (if any — read from
 *                      request attributes; no hard dep on the
 *                      tenancy package)
 *
 * Never captures request body, headers, or cookies — those may
 * carry secrets and the masker would strip them anyway, so we
 * simply don't collect them here.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

#[AsMiddleware(alias: 'exception-context', groups: [], priority: 55)]
final class CaptureExceptionContext
{
    /**
     * Container key the snapshot is written to. Reporters read
     * this same key; if a downstream package needs the same data
     * it should read via the container binding, not by injecting
     * the Request directly (which would couple domain code to the
     * HTTP layer).
     */
    public const CONTEXT_KEY = 'academorix.exception_context';

    public function __construct(private readonly Application $app)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $context = [
            'method' => $request->method(),
            'path' => '/' . ltrim($request->path(), '/'),
            'route' => optional($request->route())->getName(),
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'correlation_id' => $request->attributes->get('correlation_id'),
        ];

        if ($request->user() !== null) {
            $context['user_id'] = (string) $request->user()->getAuthIdentifier();
        }

        // Convention: apps that use a tenant middleware SHOULD stash
        // the resolved tenant id on the request as `tenant_id`. We
        // pick it up here without a hard dependency on any tenancy
        // package.
        if ($request->attributes->has('tenant_id')) {
            $context['tenant_id'] = $request->attributes->get('tenant_id');
        }

        $this->app->instance(self::CONTEXT_KEY, $context);

        return $next($request);
    }
}
