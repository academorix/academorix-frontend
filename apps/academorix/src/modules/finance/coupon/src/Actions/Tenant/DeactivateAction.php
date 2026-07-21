<?php

declare(strict_types=1);

namespace Stackra\Coupon\Actions\Tenant;

use Stackra\Coupon\Contracts\Data\CouponInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Stackra\Coupon\Data\CouponData;
use Stackra\Coupon\Data\Requests\DeactivateCouponRequestData;
use Stackra\Coupon\Events\CouponDeactivated;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * `POST /api/v1/coupons/{coupon}/deactivate` — flip is_active false.
 *
 * Existing redemptions are preserved — deactivation is idempotent (calling
 * it twice on an already-inactive coupon is a no-op). Fires
 * `CouponDeactivated` on the first transition true → false.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.deactivate.deactivate')]
#[Post('/api/v1/coupons/{coupon}/deactivate')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class DeactivateAction
{
    use AsController;

    public function __construct(
        private readonly CouponRepositoryInterface $repository,
    ) {
    }

    /**
     * Deactivate one coupon.
     *
     * @param  Request                        $request  Carrier of the resolved
     *                                                  tenant id + auth user.
     * @param  string                         $id       Primary key.
     * @param  DeactivateCouponRequestData    $data     Optional reason for audit.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     *
     * @return CouponData  The updated (now-inactive) coupon.
     */
    public function __invoke(Request $request, string $id, DeactivateCouponRequestData $data): CouponData
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        $userId = (string) ($request->user()?->getAuthIdentifier() ?? '');

        $coupon = DB::transaction(function () use ($id, $tenantId, $userId, $data) {
            $model = $this->repository->findOrFail($id);
            $wasActive = (bool) $model->getAttribute(CouponInterface::ATTR_IS_ACTIVE);

            if ($wasActive) {
                $model = $this->repository->update($id, [
                    CouponInterface::ATTR_IS_ACTIVE => false,
                ]);

                Event::dispatch(new CouponDeactivated(
                    couponId: $id,
                    tenantId: $tenantId,
                    deactivatedAt: (new \DateTimeImmutable())->format(DATE_ATOM),
                    deactivatedByUserId: $userId,
                    reason: (string) ($data->reason ?? 'manual'),
                ));
            }

            return $model;
        });

        return CouponData::from($coupon);
    }
}
