<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Platform;

use Academorix\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Academorix\Coupon\Data\CouponRedemptionData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\PaginatedDataCollection;

/**
 * `GET /api/v1/platform/coupons/redemptions` — cross-tenant redemption ledger.
 *
 * Platform-admin only surface for regulator-facing reporting + support
 * intervention. NEVER exposed to tenant users. Reads bypass the
 * `BelongsToTenant` global scope via the repository's platform channel
 * (the `platform_admin` guard-scoped filter).
 *
 * Filter params: filter[tenant_id], filter[redeemed_at.gte/lte],
 * filter[reversed] (bool).
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.platform.redemptions.list')]
#[Get('/api/v1/platform/coupons/redemptions')]
#[Middleware(['api', 'auth:sanctum', 'platform_admin'])]
final class ListRedemptionAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedemptionRepositoryInterface $repository,
    ) {
    }

    /**
     * List redemptions cross-tenant.
     *
     * @param  Request  $request  Filters + pagination controls.
     *
     * @return PaginatedDataCollection<int, CouponRedemptionData>
     */
    public function __invoke(Request $request): PaginatedDataCollection
    {
        // The `platform_admin` middleware sets a request attribute that the
        // repository's global scope reads to lift the tenant filter. Callers
        // MUST use the `filter[tenant_id]=<id>` query param for tenant-scoped
        // slices — cross-tenant scans without a filter are the whole point of
        // this endpoint.
        /** @var LengthAwarePaginator<int, \Academorix\Coupon\Models\CouponRedemption> $page */
        $page = $this->repository->paginate(
            perPage: (int) $request->integer('per_page', 25),
        );

        return CouponRedemptionData::collect($page, PaginatedDataCollection::class);
    }
}
