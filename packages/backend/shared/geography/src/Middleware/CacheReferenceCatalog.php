<?php

declare(strict_types=1);

namespace Stackra\Geography\Middleware;

use Closure;
use Illuminate\Contracts\Cache\Factory as CacheFactory;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\Request;
use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware alias `geography.cache` — response cache for reference
 * catalog GET routes.
 *
 * Cache key format:
 *
 *     ${prefix}:${verb}:${path}:${sha1(sorted_query)}:${locale}
 *
 * TTL from `config('geography.cache.ttl')` (default 3600s). Bypassed
 * when `config('geography.cache.enabled')` is false OR when the
 * request is not a GET. NEVER wraps `/geolocate` — that endpoint has
 * its own per-`(ip, locale)` cache inside the service.
 *
 * ## Octane-safety note
 *
 * The middleware is instantiated as a shared class under Octane
 * (Laravel resolves middlewares as singletons via the kernel). The
 * dependency on the concrete cache store therefore MUST arrive via
 * the container so the resolved repository is Octane-safe:
 *
 *   * `#[Cache]` (Laravel's contextual attribute) is the canonical
 *     path, but it lives on constructor parameters + only fires under
 *     make(). For middleware injected by Laravel's kernel, the
 *     container makes the class + auto-wires by TYPE.
 *   * Injecting `CacheFactory` (the manager) + calling `->store()` per
 *     request is the Octane-safe pattern: the factory is stateless
 *     (one per app), while `->store()` returns the correct repository
 *     for the current worker's config cache. NO facades in the request
 *     path — see `.kiro/steering/octane-first-di.md` §Rules — don't §2.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'geography.cache', priority: 45)]
final class CacheReferenceCatalog
{
    /**
     * @param  CacheFactory  $cacheFactory  Container-injected cache
     *                                      manager. `->store()` resolves
     *                                      the default store on each
     *                                      request.
     */
    public function __construct(
        private readonly CacheFactory $cacheFactory,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bypass when the master switch is off, or on non-GET requests,
        // or when the path is `/geolocate` (which owns its own cache).
        if (! (bool) \config('geography.cache.enabled', true)) {
            return $next($request);
        }

        if (! $request->isMethod('GET')) {
            return $next($request);
        }

        if (\str_contains($request->path(), 'geolocate')) {
            return $next($request);
        }

        $store = $this->store();
        $key   = $this->cacheKey($request);
        $ttl   = (int) \config('geography.cache.ttl', 3600);

        // Cache-hit path — hydrate the serialised response envelope.
        $cached = $store->get($key);
        if (\is_array($cached) && isset($cached['status'], $cached['content'])) {
            return response(
                (string) $cached['content'],
                (int) $cached['status'],
                \is_array($cached['headers'] ?? null) ? $cached['headers'] : [],
            );
        }

        /** @var Response $response */
        $response = $next($request);

        // Only cache 2xx responses — errors change with tenant context.
        $status = $response->getStatusCode();
        if ($status < 200 || $status >= 300) {
            return $response;
        }

        $store->put($key, [
            'status'  => $status,
            'content' => $response->getContent(),
            'headers' => $response->headers->all(),
        ], $ttl);

        return $response;
    }

    /**
     * Resolve the cache store from the injected factory.
     *
     * Prefers a taggable store when available so listeners can flush
     * by tag on write events. The factory returns the framework's
     * default store; a package-level config knob can override the
     * store name later without touching this middleware.
     */
    private function store(): Repository
    {
        return $this->cacheFactory->store();
    }

    /**
     * Build a stable cache key from the request path + sorted query
     * + resolved locale. `sha1` of the sorted query preserves order
     * insensitivity without leaking arbitrary strings into the key.
     */
    private function cacheKey(Request $request): string
    {
        $prefix = (string) \config('geography.cache.prefix', 'geography.ref');

        $query = $request->query();
        \ksort($query);

        $queryHash = \sha1(\http_build_query($query));
        $locale    = (string) \app()->getLocale();

        return \sprintf(
            '%s:GET:%s:%s:%s',
            $prefix,
            $request->path(),
            $queryHash,
            $locale,
        );
    }
}
