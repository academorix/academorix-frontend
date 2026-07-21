<?php

declare(strict_types=1);

namespace Stackra\Coupon\Services;

use Stackra\Coupon\Contracts\Data\CouponInterface;
use Stackra\Coupon\Contracts\Data\CouponRedemptionInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Stackra\Coupon\Contracts\Services\ClawbackHandlerInterface;
use Stackra\Coupon\Events\CouponClawbackCompleted;
use Stackra\Coupon\Events\CouponClawbackRequested;
use Stackra\Coupon\Exceptions\CouponClawbackFailedException;
use Stackra\Coupon\Exceptions\CouponRedemptionAlreadyReversedException;
use Stackra\Coupon\Exceptions\CouponRedemptionNotFoundException;
use Stackra\Coupon\Models\CouponRedemption;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * Reference implementation of
 * {@see \Stackra\Coupon\Contracts\Services\ClawbackHandlerInterface}.
 *
 * Called by `ProcessCouponClawbackJob` in response to a `CouponClawbackRequested`
 * event fired from the finance module (`InvoiceRefunded`, `ChargebackFiled`).
 *
 * Distinct from `CouponRedeemer::reverse()` — that method is the admin
 * correction path; this service is the automated finance-cascade path.
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class ClawbackHandler implements ClawbackHandlerInterface
{
    public function __construct(
        private readonly CouponRedemptionRepositoryInterface $redemptions,
        private readonly CouponRepositoryInterface $coupons,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function process(
        string $tenantId,
        string $redemptionId,
        string $clawbackReason,
        string $triggeringEventId,
    ): CouponRedemption {
        // Announce intent — audit consumers subscribe to this even if the
        // clawback ultimately fails.
        Event::dispatch(new CouponClawbackRequested(
            redemptionId: $redemptionId,
            couponId: '',
            tenantId: $tenantId,
            clawbackReason: $clawbackReason,
            triggeringEventId: $triggeringEventId,
            requestedAt: (new \DateTimeImmutable())->format(DATE_ATOM),
        ));

        try {
            return DB::transaction(function () use (
                $tenantId,
                $redemptionId,
                $clawbackReason,
            ): CouponRedemption {
                /** @var CouponRedemption|null $redemption */
                $redemption = $this->redemptions->getModel()->newQuery()
                    ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
                    ->where(CouponRedemptionInterface::ATTR_ID, $redemptionId)
                    ->lockForUpdate()
                    ->first();
                if ($redemption === null) {
                    throw new CouponRedemptionNotFoundException(sprintf(
                        'ClawbackHandler: redemption "%s" not found for tenant "%s".',
                        $redemptionId,
                        $tenantId,
                    ));
                }

                if ($redemption->getAttribute(CouponRedemptionInterface::ATTR_REVERSED_AT) !== null) {
                    throw new CouponRedemptionAlreadyReversedException(sprintf(
                        'ClawbackHandler: redemption "%s" is already reversed.',
                        $redemptionId,
                    ));
                }

                $now = new \DateTimeImmutable();
                $this->redemptions->update($redemptionId, [
                    CouponRedemptionInterface::ATTR_REVERSED_AT     => $now,
                    CouponRedemptionInterface::ATTR_CLAWBACK_REASON => $clawbackReason,
                ]);

                // Decrement parent coupon usage — never below zero.
                $couponId = (string) $redemption->getAttribute(CouponRedemptionInterface::ATTR_COUPON_ID);
                $this->coupons->getModel()->newQuery()
                    ->where(CouponInterface::ATTR_ID, $couponId)
                    ->whereRaw(CouponInterface::ATTR_USAGE_COUNT . ' > 0')
                    ->decrement(CouponInterface::ATTR_USAGE_COUNT);

                Event::dispatch(new CouponClawbackCompleted(
                    redemptionId: $redemptionId,
                    couponId: $couponId,
                    tenantId: $tenantId,
                    customerType: (string) $redemption->getAttribute(CouponRedemptionInterface::ATTR_CUSTOMER_TYPE),
                    customerId: (string) $redemption->getAttribute(CouponRedemptionInterface::ATTR_CUSTOMER_ID),
                    clawbackReason: $clawbackReason,
                    reversedAmountCents: (int) $redemption->getAttribute(CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS),
                    completedAt: $now->format(DATE_ATOM),
                ));

                return $this->redemptions->findOrFail($redemptionId);
            });
        } catch (CouponRedemptionNotFoundException | CouponRedemptionAlreadyReversedException $e) {
            // Re-raise domain exceptions — the job will fail the attempt
            // and enter dead-letter after the configured retry ladder.
            throw $e;
        } catch (\Throwable $e) {
            throw new CouponClawbackFailedException(
                'ClawbackHandler: clawback failed — ' . $e->getMessage(),
                previous: $e,
            );
        }
    }
}
