<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\KillSwitches;

use Academorix\Authorization\Attributes\RequireRole;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureKillSwitchData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * `GET /api/v1/feature-flags/kill-switches` — paginated list of every kill switch.
 *
 * Platform-scoped — requires the `platform_admin` role.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.kill-switches.list')]
#[Get('/api/v1/feature-flags/kill-switches')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequireRole('platform_admin')]
final class ListKillSwitches
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
     * @return LengthAwarePaginator<int, FeatureKillSwitchData>
     */
    public function __invoke(): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, \Academorix\FeatureFlags\Models\FeatureKillSwitch> $rows */
        $rows = $this->repository->paginate();

        return $rows->through(fn ($row): FeatureKillSwitchData => FeatureKillSwitchData::fromModel($row));
    }
}
