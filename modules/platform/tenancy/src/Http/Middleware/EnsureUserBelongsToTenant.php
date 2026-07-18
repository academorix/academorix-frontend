<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Http\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Tenancy\Exceptions\CrossTenantWriteException;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Refuse cross-tenant sessions — the caller's own `tenant_id` MUST
 * match the resolved tenant.
 *
 * Runs AFTER `auth:sanctum` so the caller is resolved, then asserts
 * `auth()->user()->tenant_id === resolvedTenant()->id`. Mismatch is
 * always a bug OR an attack; the exception routes to the security
 * audit channel and pages on-call.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'tenant.user', groups: [], priority: 60)]
final class EnsureUserBelongsToTenant
{
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Validate the caller belongs to the resolved tenant.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            // No tenant context — this middleware only makes sense on
            // tenant-host routes. Fail closed.
            return new JsonResponse([
                'message' => __('tenancy::errors.tenant_not_found'),
                'code'    => 'tenancy.tenant_not_resolved',
            ], 404);
        }

        $user = $request->user();
        if ($user === null) {
            throw new AuthenticationException();
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        if (! \is_string($callerTenantId) || $callerTenantId !== $tenant->getKey()) {
            throw CrossTenantWriteException::forMismatch(
                expected: (string) $tenant->getKey(),
                actual: (string) ($callerTenantId ?? 'null'),
                model: $user::class,
            );
        }

        return $next($request);
    }
}
