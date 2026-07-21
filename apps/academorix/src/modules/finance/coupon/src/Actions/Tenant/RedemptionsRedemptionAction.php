<?php

declare(strict_types=1);

namespace Stackra\Coupon\Actions\Tenant;

use Stackra\Coupon\Contracts\Data\CouponRedemptionInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Stackra\Coupon\Data\CouponRedemptionData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\PaginatedDataCollection;

/**
 * `GET /api/v1/coupons/{coupon}/redemptions` — redemptions for one coupon.
 *
 * Same shape as the full-tenant ledger but scoped to a single parent
 * coupon by the `{coupon}` route parameter.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.redemptions.redemptions')]
#[Get('/api/v1/coupons/{coupon}/redemptions')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class RedemptionsRedemptionAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedemptionRepositoryInterface $repository,
    ) {
    }

    /**
     * List redemptions belonging to `$couponId`.
     *
     * @param  Request  $request  Filters + pagination.
     * @param  string   $couponId  Parent coupon id.
     *
     * @return PaginatedDataCollection<int, CouponRedemptionData>
     */
    public function __invoke(Request $request, string $couponId): PaginatedDataCollection
    {
        /** @var LengthAwarePaginator<int, \Stackra\Coupon\Models\CouponRedemption> $page */
        $page = $this->repository->getModel()->newQuery()
            ->where(CouponRedemptionInterface::ATTR_COUPON_ID, $couponId)
            ->orderByDesc(CouponRedemptionInterface::ATTR_REDEEMED_AT)
            ->paginate((int) $request->integer('per_page', 15));

        return CouponRedemptionData::collect($page, PaginatedDataCollection::class);
    }
}
