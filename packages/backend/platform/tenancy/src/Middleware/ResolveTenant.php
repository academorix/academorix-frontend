<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Middleware;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Models\Application;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\ServiceProvider\Dispatchers\TenancyHookDispatcher;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Models\Tenant;
use Stackra\Tenancy\Services\HostResolver;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Bind the Tenant context for the request.
 *
 * Resolution order:
 *   1. Application must already be bound (by `resolve.application`
 *      middleware, priority 20 — runs before this).
 *   2. Host lookup — `{slug}.{application.central_host}` → Tenant.
 *   3. When the host is the Application's `central_host` OR
 *      `platform_admin_host` (no tenant subdomain), the request runs
 *      unbound. Central + platform-admin routes flow through.
 *   4. When the host is a tenant subdomain but the slug doesn't
 *      match any tenant → 404.
 *
 * On successful bind, fires every registered `#[AsTenancyHook]` via
 * the {@see TenancyHookDispatcher} + registers a terminating callback
 * that mirrors the teardown on response.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'resolve.tenant', groups: ['api'], priority: 40)]
final class ResolveTenant
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
        private readonly TenantRepositoryInterface $tenants,
        private readonly TenantContextInterface $tenantContext,
        private readonly HostResolver $hostResolver,
        private readonly TenancyHookDispatcher $hookDispatcher,
    ) {
    }

    /**
     * Bind the tenant context for the request lifetime; run hooks.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $host = $request->getHost();

        // The Application resolver runs at priority 20 — it must have
        // bound by now. If not, we fall back to lookup here.
        $application = $this->resolveApplication($host);
        if ($application === null) {
            return new JsonResponse([
                'message' => __('tenancy::errors.application_not_found'),
                'code'    => 'tenancy.application_not_found',
            ], 404);
        }

        $classification = $this->hostResolver->classify($host, $application);

        // Central + admin hosts run without a tenant context.
        if ($classification === 'central' || $classification === 'admin') {
            return $next($request);
        }

        if ($classification === 'unknown') {
            return new JsonResponse([
                'message' => __('tenancy::errors.tenant_not_found'),
                'code'    => 'tenancy.tenant_not_found',
            ], 404);
        }

        // Tenant subdomain — resolve the tenant.
        $tenant = $this->resolveTenant($host, $application);
        if ($tenant === null) {
            return new JsonResponse([
                'message' => __('tenancy::errors.tenant_not_found'),
                'code'    => 'tenancy.tenant_not_found',
            ], 404);
        }

        $this->tenantContext->setCurrent($tenant);
        \app()->instance('tenant.context', $this->tenantContext);

        // Fire every registered #[AsTenancyHook] — CachePrefixTenantHook +
        // LogContextTenantHook depend on this. The dispatcher builds its
        // own TenantHookContext internally per call; we pass the raw
        // Tenant model.
        $this->hookDispatcher->fireInit($tenant);

        try {
            $response = $next($request);
        } finally {
            // Terminate hooks — mirror the init in reverse priority.
            $this->hookDispatcher->fireEnd($tenant);
            $this->tenantContext->setCurrent(null);
        }

        return $response;
    }

    /**
     * Resolve the Application from the host, falling back to default.
     */
    private function resolveApplication(string $host): ?Application
    {
        return $this->applications->findByHost($host)
            ?? $this->applications->findDefault();
    }

    /**
     * Resolve the Tenant from `{slug}.{application.central_host}`.
     */
    private function resolveTenant(string $host, Application $application): ?Tenant
    {
        $slug = $this->hostResolver->extractTenantSlug($host, $application);
        if ($slug === null) {
            return null;
        }

        return $this->tenants->findBySlug((string) $application->getKey(), $slug);
    }
}
