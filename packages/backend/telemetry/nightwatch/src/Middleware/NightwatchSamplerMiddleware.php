<?php

declare(strict_types=1);

/**
 * Nightwatch Sampler Middleware.
 *
 * Applies all discovered dynamic samplers to determine whether the
 * current request should be sampled by Nightwatch. Samplers are
 * executed in descending priority order; the first sampler that
 * returns a non-null value wins.
 *
 * Registered automatically via the #[AsMiddleware] attribute with
 * alias-only registration (no group auto-apply). Apply manually
 * to routes that need dynamic sampling:
 *
 *   Route::middleware('nightwatch.sampler')->group(fn () => ...);
 *
 * @category Middleware
 *
 * @since    1.0.0
 *
 * @see \Stackra\Nightwatch\Contracts\NightwatchSampler
 */

namespace Stackra\Nightwatch\Middleware;

use Closure;
use Illuminate\Container\Attributes\Tag;
use Illuminate\Http\Request;
use Laravel\Nightwatch\Facades\Nightwatch;
use Stackra\Nightwatch\Contracts\NightwatchSampler;
use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that evaluates dynamic Nightwatch samplers.
 *
 * Samplers are resolved from the container via the 'nightwatch.sampler'
 * tag and sorted by priority (highest first). The first sampler to
 * return true or false determines the sampling decision.
 */
#[AsMiddleware(
    alias: 'nightwatch.sampler',
    priority: 0,
)]
class NightwatchSamplerMiddleware
{
    /**
     * Create a new middleware instance.
     *
     * @param iterable<NightwatchSampler> $samplers Tagged sampler instances.
     */
    public function __construct(
        #[Tag('nightwatch.sampler')]
        protected iterable $samplers,
    ) {}

    /**
     * Handle an incoming request.
     *
     * Iterates through all registered samplers in descending priority
     * order. The first sampler to return a non-null boolean value
     * determines whether Nightwatch samples or skips this request.
     * If all samplers return null, the default sampling rate applies.
     *
     * @param  Request $request The incoming HTTP request.
     * @param  Closure $next    The next middleware in the pipeline.
     * @return Response The HTTP response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sorted = collect($this->samplers)
            ->sortByDesc(fn (NightwatchSampler $s): int => $s->priority());

        foreach ($sorted as $sampler) {
            $result = $sampler->shouldSample($request);

            if ($result === true) {
                Nightwatch::sample();
                break;
            }

            if ($result === false) {
                Nightwatch::dontSample();
                break;
            }
        }

        return $next($request);
    }
}
