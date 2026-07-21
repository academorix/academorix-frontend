<?php

declare(strict_types=1);

namespace Stackra\Geography\RateLimiters;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Rate-limiter definition for the `throttle:geolocate` middleware.
 *
 * Called ONCE from `GeographyServiceProvider`'s `#[OnBoot]` hook
 * so the limiter is registered before the router mounts the
 * `/geolocate` route. Guest requests fall back to per-ip limits;
 * `auth:sanctum` on the route means guests won't reach here in
 * practice.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeolocateRateLimiter
{
    /**
     * Register the rate-limiter definition. Idempotent — calling
     * `RateLimiter::for` a second time replaces the first definition.
     */
    public static function register(): void
    {
        $perMinute = (int) \config('geography.geolocate.rate_limit.per_minute', 10);

        RateLimiter::for('geolocate', static function (Request $request) use ($perMinute): Limit {
            $userId = $request->user()?->getAuthIdentifier();

            // Authed → cap per user_id (typical path). Guest → per ip
            // as a defensive fallback; `auth:sanctum` on the route
            // rejects guests before they reach the limiter.
            if ($userId !== null) {
                return Limit::perMinute($perMinute)->by('user:' . $userId);
            }

            return Limit::perMinute($perMinute)->by('ip:' . $request->ip());
        });
    }
}
