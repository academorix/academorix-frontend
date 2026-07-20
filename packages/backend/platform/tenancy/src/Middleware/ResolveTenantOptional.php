<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Middleware;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Tenancy\Services\HostResolver;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Same as {@see ResolveTenant} but does NOT 404 when the host does
 * not match a tenant.
 *
 * Used on public read endpoints (public branding preview, newsletter
 * subscribe) where an anonymous request may hit a not-yet-verified
 * custom domain. The response headers still carry the resolved
 * context when one is bound; the caller decides how to react to the
 * "no context" case.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'resolve.tenant.optional', groups: [], priority: 40)]
final class ResolveTenantOptional
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
        private readonly TenantRepositoryInterface $tenants,
        private readonly TenantContextInterface $tenantContext,
        private readonly HostResolver $hostResolver,
    ) {
    }

    /**
     * Best-effort bind — never fails; always forwards.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $host        = $request->getHost();
        $application = $this->applications->findByHost($host)
            ?? $this->applications->findDefault();

        if ($application === null) {
            return $next($request);
        }

        $slug = $this->hostResolver->extractTenantSlug($host, $application);
        if ($slug === null) {
            return $next($request);
        }

        $tenant = $this->tenants->findBySlug((string) $application->getKey(), $slug);
        if ($tenant !== null) {
            $this->tenantContext->setCurrent($tenant);
            \app()->instance('tenant.context', $this->tenantContext);
        }

        try {
            return $next($request);
        } finally {
            $this->tenantContext->setCurrent(null);
        }
    }
}
