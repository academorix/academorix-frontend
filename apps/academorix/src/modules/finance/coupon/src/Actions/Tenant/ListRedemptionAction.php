<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

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
 * `GET /api/v1/coupons/redemptions` — the tenant-wide redemption ledger.
 *
 * Every redemption for the caller's tenant, paginated + filterable
 * per `Repository`'s `#[Filterable('*')]`. Never exposes a redemption
 * from a different tenant — the repository composes the tenant global
 * scope via `BelongsToTenant`.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.redemptions.list')]
#[Get('/api/v1/coupons/redemptions')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ListRedemptionAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedemptionRepositoryInterface $repository,
    ) {
    }

    /**
     * List redemptions.
     *
     * @param  Request  $request  Filters + pagination controls.
     *
     * @return PaginatedDataCollection<int, CouponRedemptionData>
     */
    public function __invoke(Request $request): PaginatedDataCollection
    {
        /** @var LengthAwarePaginator<int, \Academorix\Coupon\Models\CouponRedemption> $page */
        $page = $this->repository->paginate(
            perPage: (int) $request->integer('per_page', 15),
        );

        return CouponRedemptionData::collect($page, PaginatedDataCollection::class);
    }
}
