<?php

declare(strict_types=1);

namespace Stackra\Geography\Middleware;

use Stackra\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware alias `world.locale` — resolve the active locale used
 * by {@see \Stackra\Geography\Concerns\HasWorldLocalizedName}.
 *
 * Resolution order:
 *
 *   1. `?locale=fr` query parameter
 *   2. `X-Locale` request header
 *   3. `Accept-Language` best-match
 *   4. `app()->currentLocale()`
 *
 * Sets the resolved locale via `app()->setLocale(...)` so downstream
 * translation calls (via `Lang::has` / `__()`) see the caller's
 * intent. Runs AFTER localization::locale.resolve when both modules
 * are present (deferred to Stackra locale by default via
 * priority).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'world.locale', priority: 13)]
final class ResolveLocaleForWorld
{
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        if ($locale !== null) {
            \app()->setLocale($locale);
        }

        return $next($request);
    }

    /**
     * Walk the resolution chain in order.
     */
    private function resolveLocale(Request $request): ?string
    {
        // 1. Explicit query parameter — highest precedence.
        $query = $request->query('locale');
        if (\is_string($query) && $query !== '') {
            return $this->sanitize($query);
        }

        // 2. `X-Locale` header — explicit but out-of-band.
        $header = (string) $request->header('X-Locale', '');
        if ($header !== '') {
            return $this->sanitize($header);
        }

        // 3. Accept-Language — first entry wins as a best-effort.
        $accept = (string) $request->header('Accept-Language', '');
        if ($accept !== '') {
            $first = \explode(',', $accept, 2)[0] ?? '';
            $first = \trim(\explode(';', $first, 2)[0] ?? '');
            if ($first !== '') {
                return $this->sanitize($first);
            }
        }

        // 4. Fall through to the app's current locale — the base
        // middleware chain sets this from the app config.
        return null;
    }

    /**
     * Whitelist locale strings — must be [a-zA-Z0-9-] to prevent
     * injection into `app()->setLocale()`. 12 char max matches the
     * BCP-47 practical limit (`zh-Hant-HK`).
     */
    private function sanitize(string $locale): ?string
    {
        $locale = \substr($locale, 0, 12);

        return \preg_match('/^[a-zA-Z0-9-]+$/', $locale) === 1 ? $locale : null;
    }
}
