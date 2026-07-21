<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\KillSwitches;

use Stackra\Authorization\Attributes\RequireRole;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/feature-flags/kill-switches/{id}` — soft-delete a kill switch.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.kill-switches.delete')]
#[Delete('/api/v1/feature-flags/kill-switches/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequireRole('platform_admin')]
#[WhereUlid('id')]
final class DeleteKillSwitch
{
    /**
     * @param  FeatureKillSwitchRepositoryInterface  $repository  Kill-switch persistence boundary.
     */
    public function __construct(
        private readonly FeatureKillSwitchRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  string  $id  Kill-switch id from the URL.
     * @return Response
     */
    public function __invoke(string $id): Response
    {
        $this->repository->delete($id);

        return \response()->noContent();
    }
}
