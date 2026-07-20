<?php

declare(strict_types=1);

namespace Academorix\Versioning\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Versioning\Contracts\Services\SunsetHeaderEmitterInterface;
use Academorix\Versioning\Contracts\Services\VersionResolverChainInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Runs the version resolver chain on inbound requests, binds the
 * resolved slug onto the request attributes, and decorates outbound
 * responses with the RFC 8594 Sunset header when the version is
 * deprecated.
 *
 * ```php
 * #[Middleware(['versioning.resolve'])]
 * ```
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'versioning.resolve', groups: ['api'], priority: 30)]
final class ResolveVersioning
{
    /**
     * Request attribute the resolved slug is bound to.
     */
    public const string REQUEST_ATTRIBUTE = 'academorix.versioning.resolved';

    public function __construct(
        private readonly VersionResolverChainInterface $chain,
        private readonly SunsetHeaderEmitterInterface $sunsetEmitter,
    ) {
    }

    /**
     * Handle an inbound request.
     */
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $slug = $this->chain->resolve($request);
        if ($slug === null || $slug === '') {
            $slug = (string) \config('versioning.default', 'v1');
        }

        $request->attributes->set(self::REQUEST_ATTRIBUTE, $slug);

        /** @var SymfonyResponse $response */
        $response = $next($request);

        // Only Laravel `Response` instances carry the decorated
        // header contract we depend on — streamed / binary responses
        // pass through unchanged.
        if ($response instanceof Response) {
            $response = $this->sunsetEmitter->emit($response, $slug);
        }

        return $response;
    }
}
