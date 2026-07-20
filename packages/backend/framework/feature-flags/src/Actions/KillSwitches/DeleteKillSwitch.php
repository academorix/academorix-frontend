<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\KillSwitches;

use Academorix\Authorization\Attributes\RequireRole;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
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
