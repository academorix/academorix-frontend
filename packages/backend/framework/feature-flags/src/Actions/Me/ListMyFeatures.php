<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Me;

use Stackra\FeatureFlags\Contracts\FeatureCheckerInterface;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Illuminate\Http\Response;

/**
 * `GET /api/v1/me/features` — diagnostic endpoint returning full resolutions.
 *
 * Not timeout-guarded (unlike the boot payload) — this is what
 * consumers hit when the compact `me.features` map is missing.
 * Response shape: `{ features: {name: bool}, resolutions: {name: {value, source}} }`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.me.list')]
#[Get('/api/v1/me/features')]
#[Middleware(['api', 'auth:sanctum'])]
final class ListMyFeatures
{
    /**
     * @param  FeatureFlagRegistry       $registry  Runtime flag registry.
     * @param  FeatureCheckerInterface   $checker   Flag evaluation boundary.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureCheckerInterface $checker,
    ) {}

    /**
     * Handle the request.
     *
     * @return Response
     */
    public function __invoke(): Response
    {
        $names = $this->registry->names();

        try {
            $values = $this->checker->values($names);
        } catch (\Throwable $error) {
            \abort(Response::HTTP_BAD_REQUEST, 'feature_flags.no_tenant_context');
        }

        $resolutions = [];
        foreach ($names as $name) {
            $resolution         = $this->checker->resolution($name);
            $resolutions[$name] = [
                'value'  => $resolution->value,
                'source' => $resolution->source,
            ];
        }

        return \response([
            'features'    => $values,
            'resolutions' => $resolutions,
        ]);
    }
}
