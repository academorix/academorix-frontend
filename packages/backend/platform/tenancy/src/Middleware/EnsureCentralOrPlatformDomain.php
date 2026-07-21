<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Middleware;

use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Reject tenant subdomains on routes that must run on the central OR
 * platform-admin host.
 *
 * Prevents a self-serve register call (`POST /api/v1/tenants/register`)
 * from accidentally landing inside a tenant scope. Runs AFTER
 * {@see ResolveTenant} so it can consult the bound context.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'platform.domain', groups: [], priority: 20)]
final class EnsureCentralOrPlatformDomain
{
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Reject requests with a bound tenant context.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if ($this->tenantContext->current() !== null) {
            return new JsonResponse([
                'message' => __('tenancy::errors.tenant_context_not_allowed'),
                'code'    => 'tenancy.tenant_context_not_allowed',
            ], 400);
        }

        return $next($request);
    }
}
