<?php

declare(strict_types=1);

namespace Academorix\Application\Middleware;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Services\ApplicationResolver;
use Academorix\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Bind the Application context for the request.
 *
 * Resolution order:
 *   1. `X-Application-Id` header (explicit — used by cross-service
 *      callers with a JWT bound to a specific Application).
 *   2. `Host` header lookup against `applications.central_host` OR
 *      `applications.platform_admin_host`.
 *   3. Fallback to the `is_default = true` row.
 *
 * Every response has `Application-Bound: {slug}` header when a context
 * was successfully bound. Missing-context is a 400 for tenant-audience
 * routes; central + guest routes may proceed unbound.
 *
 * Discovered via `#[AsMiddleware]` (per `.kiro/steering/php-attributes.md`).
 * Alias `resolve.application` — routes opt in via the `Academorix\Routing`
 * middleware group.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'resolve.application', groups: ['api'], priority: 20)]
final class ResolveApplication
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
        private readonly ApplicationResolver $resolver,
    ) {}

    /**
     * Handle the incoming request — bind the Application context, then
     * dispatch. Empties context after the response so the container
     * carries no request-specific state (Octane hygiene).
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $application = $this->resolveFromRequest($request);

        if ($application === null) {
            // The `platform.domain` guard on tenant-audience routes will
            // 400 downstream when it finds no bound context. Central +
            // guest routes flow through unbound.
            return $next($request);
        }

        $this->resolver->bind($application);
        $response = $next($request);

        // Emit the trace header for cross-service correlation.
        $response->headers->set('Application-Bound', (string) $application->slug);

        return $response;
    }

    /**
     * Actual resolution — header → host → default.
     */
    private function resolveFromRequest(Request $request): ?\Academorix\Application\Models\Application
    {
        // 1. Explicit X-Application-Id header (JWT-bound service callers).
        $headerId = $request->header('X-Application-Id');
        if (\is_string($headerId) && $headerId !== '') {
            $found = $this->applications->find($headerId);
            if ($found !== null) {
                return $found;
            }
        }

        // 2. Host lookup — the primary path for browser requests.
        $host = $request->getHost();
        $found = $this->applications->findByHost($host);
        if ($found !== null) {
            return $found;
        }

        // 3. Fallback to default.
        return $this->applications->findDefault();
    }
}
