<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

use Academorix\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Academorix\Coupon\Data\CouponRedemptionData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/coupons/redemptions/{redemption}` — one redemption row.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.redemptions.show')]
#[Get('/api/v1/coupons/redemptions/{redemption}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ShowRedemptionAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedemptionRepositoryInterface $repository,
    ) {
    }

    /**
     * Fetch one redemption by id.
     *
     * @param  string  $id  Primary key.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  Row absent or scoped out.
     *
     * @return CouponRedemptionData
     */
    public function __invoke(string $id): CouponRedemptionData
    {
        return CouponRedemptionData::from($this->repository->findOrFail($id));
    }
}
