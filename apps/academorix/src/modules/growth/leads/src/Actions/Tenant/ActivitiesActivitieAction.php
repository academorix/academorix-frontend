<?php

declare(strict_types=1);

namespace Stackra\Leads\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Leads\Contracts\Data\LeadActivityInterface;
use Stackra\Leads\Contracts\Repositories\LeadActivityRepositoryInterface;
use Stackra\Leads\Contracts\Repositories\LeadRepositoryInterface;
use Stackra\Leads\Data\LeadActivityData;
use Stackra\Leads\Enums\LeadsPermission;
use Stackra\Leads\Models\LeadActivity;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\PaginatedDataCollection;

/**
 * `GET /api/v1/leads/{lead}/activities` — per-lead activity timeline.
 *
 * Reverse-chronological (newest first) by `occurred_at`, paginated
 * via `?per_page=<int>` (default 25, capped at 100 by the base
 * repository). The route-model-binding step verifies the lead
 * exists + is visible to the current tenant BEFORE this handler
 * runs; the query below then narrows to that lead's rows.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[AsAction(name: 'leads.activities.list')]
#[Get('/api/v1/leads/{lead}/activities')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(LeadsPermission::LeadActivitiesViewAny)]
final class ActivitiesActivitieAction
{
    use AsController;

    public function __construct(
        private readonly LeadRepositoryInterface $leads,
        private readonly LeadActivityRepositoryInterface $activities,
    ) {
    }

    /**
     * @param  string   $lead     ULID from the URL.
     * @param  Request  $request  For `per_page` overrides.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  When the lead is absent / tenant-scoped out.
     *
     * @return PaginatedDataCollection<int, LeadActivityData>
     */
    public function __invoke(string $lead, Request $request): PaginatedDataCollection
    {
        // Route-model-check — throws 404 when the lead is out of tenant
        // scope before we run the child query.
        $this->leads->findOrFail($lead);

        $perPage = \min(100, \max(1, (int) $request->integer('per_page', 25)));

        /** @var LengthAwarePaginator<int, LeadActivity> $page */
        $page = LeadActivity::query()
            ->where(LeadActivityInterface::ATTR_LEAD_ID, $lead)
            ->orderByDesc(LeadActivityInterface::ATTR_OCCURRED_AT)
            ->paginate($perPage);

        return LeadActivityData::collect($page, PaginatedDataCollection::class);
    }
}
