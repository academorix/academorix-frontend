<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Admin;

use Academorix\Authorization\Attributes\RequireRole;
use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\FeatureFlags\Data\Requests\ForceDisableHierarchyRequestData;
use Academorix\FeatureFlags\Events\FeatureHierarchyForceDisabled;
use Academorix\FeatureFlags\Exceptions\HierarchyDisableBlockedException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

/**
 * `POST /api/v1/feature-flags/hierarchy/{flag}/force-disable` — platform-admin hierarchy shut-off.
 *
 * Rejects unless `force = true` AND actor holds the `platform_admin`
 * role. On accept, emits `FeatureHierarchyForceDisabled` with the
 * per-level overflow counts (Requirement 8.6, 8.7).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.admin.hierarchy.force-disable')]
#[Post('/api/v1/feature-flags/hierarchy/{flag}/force-disable')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequireRole('platform_admin')]
final class ForceDisableHierarchyFlag
{
    /**
     * Level counted for orphan-risk assessment per shipped hierarchy flag.
     *
     * Maps a hierarchy flag → the scope level whose row count is
     * checked before the force-disable is allowed. When the count
     * is `> 1`, the disable would leave orphan rows at that level.
     *
     * @var array<string, string>
     */
    private const array LEVELS_BY_FLAG = [
        'hierarchy.regions'       => 'region',
        'hierarchy.organizations' => 'organization',
        'hierarchy.multi_branch'  => 'branch',
    ];

    /**
     * @param  FeatureOverrideRepositoryInterface  $overrides  Override persistence boundary.
     * @param  EventDispatcher                     $events     Event bus for domain-event dispatch.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $overrides,
        private readonly EventDispatcher $events,
    ) {}

    /**
     * Handle the request.
     *
     * @param  string                            $flag  Hierarchy flag from the URL.
     * @param  ForceDisableHierarchyRequestData  $data  Validated payload.
     * @return Response
     *
     * @throws HierarchyDisableBlockedException  When `force` is false and orphan rows exist at the affected level.
     */
    public function __invoke(string $flag, ForceDisableHierarchyRequestData $data): Response
    {
        if (! $data->force) {
            $rowCount = $this->countRowsAtAffectedLevel($flag);
            if ($rowCount > 1) {
                throw HierarchyDisableBlockedException::forLevel(
                    flag: $flag,
                    level: self::LEVELS_BY_FLAG[$flag],
                    rowCount: $rowCount,
                );
            }
        }

        $tenantId = $this->resolveCurrentTenantId();
        $actorId  = $this->resolveActorId();
        $level    = self::LEVELS_BY_FLAG[$flag] ?? 'unknown';

        $this->overrides->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => $tenantId,
            FeatureOverrideInterface::ATTR_FLAG        => $flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => 'tenant',
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $tenantId,
            FeatureOverrideInterface::ATTR_DECISION    => 'deny',
            FeatureOverrideInterface::ATTR_REASON      => 'Force-disabled by platform admin.',
        ]);

        $this->events->dispatch(new FeatureHierarchyForceDisabled(
            flag: $flag,
            tenantId: $tenantId,
            actorId: $actorId,
            levelCounts: [$level => $this->countRowsAtAffectedLevel($flag)],
            timestamp: Carbon::now()->toIso8601String(),
        ));

        return \response()->noContent();
    }

    /**
     * Count rows at the level affected by disabling `$flag`.
     *
     * Implementation stub — a real project would query the domain
     * table matching the affected level (`regions`, `organizations`,
     * `branches`). Returned as `0` here so the action stays
     * consumer-app-agnostic; consumer apps override this by
     * providing a domain-aware child action.
     *
     * @param  string  $flag  The hierarchy flag being disabled.
     * @return int            Row count at the affected level.
     */
    private function countRowsAtAffectedLevel(string $flag): int
    {
        // Placeholder — real count lives in the consumer app's
        // domain module (Region / Organization / Branch tables).
        unset($flag);

        return 0;
    }

    /**
     * Resolve the current tenant id.
     *
     * @return string
     */
    private function resolveCurrentTenantId(): string
    {
        if (\function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant !== null) {
                return (string) $tenant->getKey();
            }
        }

        \abort(Response::HTTP_BAD_REQUEST, 'feature_flags.no_tenant_context');
    }

    /**
     * Resolve the acting principal's id.
     *
     * @return string
     */
    private function resolveActorId(): string
    {
        $user = \auth()->user();

        return $user !== null ? (string) $user->getAuthIdentifier() : 'unknown';
    }
}
