<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Middleware;

use Stackra\FeatureFlags\Contracts\FeatureCheckerInterface;
use Stackra\FeatureFlags\Exceptions\FeatureDisabledException;
use Stackra\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Http\Request;

/**
 * HTTP middleware that gates a route behind a feature flag.
 *
 * Auto-attached to any route whose action class carries
 * `#[RequireFeature(name)]`. Evaluates the flag through the
 * checker; a false resolution raises `FeatureDisabledException`
 * whose HTTP status is driven by the deciding source — 402 for
 * `plan_gate`, 403 for every other source (Requirement 5.4-5.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'feature')]
final class RequireFeatureMiddleware
{
    /**
     * @param  FeatureCheckerInterface  $checker  Flag evaluation boundary.
     */
    public function __construct(
        private readonly FeatureCheckerInterface $checker,
    ) {}

    /**
     * Handle the request.
     *
     * @param  Request  $request  Incoming HTTP request.
     * @param  Closure  $next     Next middleware in the stack.
     * @param  string   $flag     Flag identifier passed as the alias argument.
     * @return mixed
     *
     * @throws FeatureDisabledException  When the flag resolves to false.
     */
    public function handle(Request $request, Closure $next, string $flag): mixed
    {
        $resolution = $this->checker->resolution($flag);

        if ($resolution->value) {
            return $next($request);
        }

        throw FeatureDisabledException::forResolution($flag, $resolution);
    }
}
