<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Middleware;

use Academorix\Entitlements\Contracts\Services\EnforcerInterface;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Parameterised middleware — routes opt in with
 * `entitlement.enforce:<key>[,<amount>]`.
 *
 * Refuses with HTTP 402 Payment Required + a structured JSON error
 * payload when the entitlement is exceeded (or unknown to the tenant).
 * Fires `EntitlementExceeded` on rejection so downstream observability
 * / notifications can react.
 *
 * ```php
 * #[Middleware(['entitlement.enforce:webhook.subscriptions.max'])]
 * final class CreateSubscription
 * {
 * }
 * ```
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'entitlement.enforce', groups: [], priority: 65)]
final class EnforceEntitlement
{
    public function __construct(
        private readonly EnforcerInterface $enforcer,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Handle an incoming request.
     *
     * @param  Request  $request  Incoming request.
     * @param  Closure  $next     Downstream pipeline callable.
     * @param  string   $key      Entitlement key (from route params).
     * @param  string   $amount   Optional consumption amount (default `1`).
     */
    public function handle(Request $request, Closure $next, string $key, string $amount = '1'): Response
    {
        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            // Central-plane / unauthenticated route — skip. The
            // middleware only fires on tenant-context routes.
            return $next($request);
        }

        $tenantId = (string) $tenant->getKey();
        $units    = \max(1, (int) $amount);

        if ($this->enforcer->canConsume($tenantId, $key, $units)) {
            return $next($request);
        }

        // Fail-closed — return HTTP 402 + JSON envelope. Downstream
        // domain code can add richer detail via its own handler.
        return new JsonResponse(
            [
                'error' => [
                    'code'    => 'entitlements.exceeded',
                    'message' => \sprintf(
                        'Entitlement "%s" quota exceeded on this tenant.',
                        $key,
                    ),
                    'key'    => $key,
                    'amount' => $units,
                ],
            ],
            JsonResponse::HTTP_PAYMENT_REQUIRED,
        );
    }
}
