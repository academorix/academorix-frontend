<?php

declare(strict_types=1);

namespace Stackra\Coupon\Actions\Tenant;

use Stackra\Coupon\Contracts\Data\CouponInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Stackra\Coupon\Data\CouponData;
use Stackra\Coupon\Data\Requests\ExtendCouponRequestData;
use Stackra\Coupon\Exceptions\CouponInactiveException;
use Stackra\Coupon\Exceptions\CouponInvalidEffectiveRangeException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/coupons/{coupon}/extend` — push the coupon expiry forward.
 *
 * Refuses (409) when the coupon is already deactivated OR when the new
 * `valid_until` is not strictly after the current NOW.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.extend.extend')]
#[Post('/api/v1/coupons/{coupon}/extend')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ExtendAction
{
    use AsController;

    public function __construct(
        private readonly CouponRepositoryInterface $repository,
    ) {
    }

    /**
     * Extend one coupon's expiry.
     *
     * @param  string                     $id    Primary key.
     * @param  ExtendCouponRequestData    $data  New `valid_until` ISO-8601 timestamp.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws CouponInactiveException                On a deactivated coupon.
     * @throws CouponInvalidEffectiveRangeException   On a non-future `valid_until`.
     *
     * @return CouponData  The updated coupon row.
     */
    public function __invoke(string $id, ExtendCouponRequestData $data): CouponData
    {
        $model = $this->repository->findOrFail($id);

        if ((bool) $model->getAttribute(CouponInterface::ATTR_IS_ACTIVE) !== true) {
            throw new CouponInactiveException(sprintf(
                'ExtendAction: cannot extend deactivated coupon "%s".',
                $id,
            ));
        }

        try {
            $newExpiry = new \DateTimeImmutable($data->validUntil);
        } catch (\Throwable $e) {
            throw new CouponInvalidEffectiveRangeException(
                'ExtendAction: valid_until is not a parseable ISO-8601 timestamp.',
            );
        }

        if ($newExpiry <= new \DateTimeImmutable()) {
            throw new CouponInvalidEffectiveRangeException(
                'ExtendAction: valid_until must be strictly in the future.',
            );
        }

        $updated = $this->repository->update($id, [
            CouponInterface::ATTR_VALID_UNTIL => $newExpiry,
        ]);

        return CouponData::from($updated);
    }
}
