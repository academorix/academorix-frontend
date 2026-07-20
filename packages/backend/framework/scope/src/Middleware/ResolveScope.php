<?php

/**
 * @file src/Middleware/ResolveScope.php
 *
 * @description
 * Middleware that walks the resolver chain, sets the active
 * context on {@see ScopeContextInterface}, and then invokes the
 * downstream stack. On resolver-chain miss it either aborts with
 * HTTP 428 (when `scope.middleware.strict` is on) or lets the
 * request through with no context (tolerated for public routes).
 */

declare(strict_types=1);

namespace Academorix\Scope\Middleware;

use Academorix\Scope\Contracts\ScopeContextInterface;
use Academorix\Scope\Contracts\ScopeResolverChainInterface;
use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Route-middleware.
 *
 * ## Alias
 *
 * Registered under the alias in `scope.middleware.alias`
 * (`'scope'` by default) so route files can attach it as:
 *
 * ```php
 * Route::middleware(['api', 'scope'])->group(function () { ... });
 * ```
 *
 * ## HTTP 428 Precondition Required
 *
 * Chosen for the strict-fail path because "you need a scope to
 * access this resource" is exactly the semantics of 428: the
 * request needs additional context up front. 400 would imply the
 * request is malformed; 403 would imply auth failure.
 */
final class ResolveScope
{
    /**
     * @param  ScopeResolverChainInterface  $chain  Ordered
     *                                              chain (Header → Jwt → TenantContext → RootFallback).
     * @param  ScopeContextInterface  $context  Per-request
     *                                          context holder — the middleware pushes the resolved
     *                                          value onto this.
     * @param  bool  $strict  Feature flag
     *                        from `config('scope.middleware.strict')` — when true,
     *                        a resolver-chain miss aborts with HTTP 428. When
     *                        false, the request passes through with no context
     *                        (tolerated for public routes).
     * @param  string  $headerName  Included in
     *                              the 428 error message so the client knows which
     *                              header to send. Read via `#[Config]` so the message
     *                              stays consistent with `HeaderScopeResolver`.
     */
    public function __construct(
        private readonly ScopeResolverChainInterface $chain,
        private readonly ScopeContextInterface $context,
        #[Config('scope.middleware.strict', true)]
        private readonly bool $strict = true,
        #[Config('scope.header.name', 'X-Scope-Node-Id')]
        private readonly string $headerName = 'X-Scope-Node-Id',
    ) {}

    /**
     * Middleware entry point.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $resolved = $this->chain->resolve($request);

        if ($resolved !== null) {
            $this->context->set($resolved);
        } elseif ($this->strict) {
            throw new HttpException(
                statusCode: 428,
                message: \sprintf(
                    'No active scope could be resolved. Provide the %s '
                    .'header or authenticate as a user with a tenant assignment.',
                    $this->headerName,
                ),
            );
        }

        return $next($request);
    }
}
