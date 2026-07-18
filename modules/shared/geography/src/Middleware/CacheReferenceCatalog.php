<?php

declare(strict_types=1);

namespace Academorix\Geography\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'geography.cache', priority: 45)]
final class CacheReferenceCatalog
{
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
     * Resolve the cache store. Prefers a taggable store when
     * available so listeners can flush by tag on write events.
     */
    private function store(): Repository
    {
        return Cache::store();
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
