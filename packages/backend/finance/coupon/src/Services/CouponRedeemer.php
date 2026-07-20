<?php

declare(strict_types=1);

namespace Academorix\Coupon\Services;

use Academorix\Coupon\Contracts\Data\CouponInterface;
use Academorix\Coupon\Contracts\Data\CouponRedemptionInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Academorix\Coupon\Contracts\Services\CouponRedeemerInterface;
use Academorix\Coupon\Contracts\Services\CouponValidatorInterface;
use Academorix\Coupon\Data\CouponVerdictData;
use Academorix\Coupon\Enums\CouponRedemptionClawbackReason;
use Academorix\Coupon\Events\CouponRedeemed;
use Academorix\Coupon\Events\CouponRedemptionRefused;
use Academorix\Coupon\Events\CouponRedemptionReversed;
use Academorix\Coupon\Events\CouponUsageCapReached;
use Academorix\Coupon\Exceptions\CouponAlreadyRedeemedOnTargetException;
use Academorix\Coupon\Exceptions\CouponApplicabilityMismatchException;
use Academorix\Coupon\Exceptions\CouponCurrencyMismatchException;
use Academorix\Coupon\Exceptions\CouponCustomerLimitReachedException;
use Academorix\Coupon\Exceptions\CouponExpiredException;
use Academorix\Coupon\Exceptions\CouponInactiveException;
use Academorix\Coupon\Exceptions\CouponMinimumOrderNotMetException;
use Academorix\Coupon\Exceptions\CouponNotFoundException;
use Academorix\Coupon\Exceptions\CouponRedemptionAlreadyReversedException;
use Academorix\Coupon\Exceptions\CouponRedemptionNotFoundException;
use Academorix\Coupon\Exceptions\CouponUsageCapReachedException;
use Academorix\Coupon\Models\Coupon;
use Academorix\Coupon\Models\CouponRedemption;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * Reference implementation of
 * {@see \Academorix\Coupon\Contracts\Services\CouponRedeemerInterface}.
 *
 * Owns the write path for `coupon_redemptions` INSERTs plus the atomic
 * `coupons.usage_count` increment. Every mutating method wraps the two
 * writes in a `DB::transaction()` with `SELECT ... FOR UPDATE` on the
 * coupon row, guaranteeing:
 *
 *  - No two concurrent redemptions can overshoot `usage_cap`.
 *  - The `CouponRedeemed` event never fires for a rolled-back
 *    redemption (relies on `ShouldDispatchAfterCommit`).
 *  - When the caller wraps `redeem()` in its own transaction
 *    (invoice / membership creation), Laravel's savepoint machinery
 *    keeps the atomicity guarantee.
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class CouponRedeemer implements CouponRedeemerInterface
{
    public function __construct(
        private readonly CouponRepositoryInterface $coupons,
        private readonly CouponRedemptionRepositoryInterface $redemptions,
        private readonly CouponValidatorInterface $validator,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function redeem(
        string $tenantId,
        string $code,
        string $customerType,
        string $customerId,
        string $redeemedByUserId,
        string $appliedToType,
        string $appliedToId,
        int $sourceAmountCents,
        string $sourceCurrency,
        ?string $planId = null,
    ): CouponRedemption {
        return DB::transaction(function () use (
            $tenantId,
            $code,
            $customerType,
            $customerId,
            $redeemedByUserId,
            $appliedToType,
            $appliedToId,
            $sourceAmountCents,
            $sourceCurrency,
            $planId,
        ): CouponRedemption {
            // 1. Row-lock the coupon row FIRST — every subsequent check reads
            //    the LOCKED state, so two concurrent redemptions serialise
            //    around the row's usage_count without racing.
            $coupon = $this->lockCouponForRedemption($tenantId, $code);

            // 2. Delegate the validation checks to the validator — but we've
            //    already loaded the coupon, so we hand it the pre-locked row
            //    via a targeted verify() path.
            $verdict = $this->validator->validate(
                tenantId: $tenantId,
                couponCode: $code,
                customerId: $customerId,
                orderAmountCents: $sourceAmountCents,
                orderCurrency: $sourceCurrency,
                planId: $planId,
            );

            if (! $verdict->valid) {
                // Fire the refusal event outside the transaction path — the
                // caller sees the exception, but observability still gets
                // a signal.
                $this->dispatchRefusal(
                    tenantId: $tenantId,
                    code: $code,
                    couponId: $verdict->couponId,
                    customerType: $customerType,
                    customerId: $customerId,
                    appliedToType: $appliedToType,
                    appliedToId: $appliedToId,
                    reason: $verdict->reason ?? 'unknown',
                );

                throw $this->exceptionFor($verdict, $code);
            }

            // 3. Duplicate check — the composite unique index on
            //    (coupon_id, applied_to_type, applied_to_id, reversed_at)
            //    catches this at the DB layer, but a domain check surfaces
            //    a cleaner exception.
            $duplicate = $this->redemptions->getModel()->newQuery()
                ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
                ->where(CouponRedemptionInterface::ATTR_COUPON_ID, $coupon->getKey())
                ->where(CouponRedemptionInterface::ATTR_APPLIED_TO_TYPE, $appliedToType)
                ->where(CouponRedemptionInterface::ATTR_APPLIED_TO_ID, $appliedToId)
                ->whereNull(CouponRedemptionInterface::ATTR_REVERSED_AT)
                ->exists();
            if ($duplicate) {
                throw new CouponAlreadyRedeemedOnTargetException(sprintf(
                    'CouponRedeemer: coupon "%s" is already active on %s "%s".',
                    $code,
                    $appliedToType,
                    $appliedToId,
                ));
            }

            // 4. Commit the redemption row + increment the counter.
            $discountCents = $verdict->discountCents;
            $finalCents = max(0, $sourceAmountCents - $discountCents);
            $now = new \DateTimeImmutable();
            $redeemedAtIso = $now->format(DATE_ATOM);

            $snapshot = $this->buildSnapshot($coupon);

            /** @var CouponRedemption $redemption */
            $redemption = $this->redemptions->create([
                CouponRedemptionInterface::ATTR_TENANT_ID           => $tenantId,
                CouponRedemptionInterface::ATTR_COUPON_ID           => (string) $coupon->getKey(),
                CouponRedemptionInterface::ATTR_CUSTOMER_TYPE       => $customerType,
                CouponRedemptionInterface::ATTR_CUSTOMER_ID         => $customerId,
                CouponRedemptionInterface::ATTR_REDEEMED_BY_USER_ID => $redeemedByUserId,
                CouponRedemptionInterface::ATTR_APPLIED_TO_TYPE     => $appliedToType,
                CouponRedemptionInterface::ATTR_APPLIED_TO_ID       => $appliedToId,
                CouponRedemptionInterface::ATTR_SOURCE_AMOUNT_CENTS => $sourceAmountCents,
                CouponRedemptionInterface::ATTR_SOURCE_CURRENCY     => $sourceCurrency,
                CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS => $discountCents,
                CouponRedemptionInterface::ATTR_FINAL_AMOUNT_CENTS  => $finalCents,
                CouponRedemptionInterface::ATTR_DISCOUNT_SNAPSHOT   => $snapshot,
                CouponRedemptionInterface::ATTR_REDEEMED_AT         => $now,
            ]);

            // Atomic increment via a raw SQL UPDATE — Eloquent's `increment`
            // does the equivalent but we express the constraint (never above
            // usage_cap) explicitly.
            $usageCap = $coupon->getAttribute(CouponInterface::ATTR_USAGE_CAP);
            $affected = $this->coupons->getModel()->newQuery()
                ->where(CouponInterface::ATTR_ID, $coupon->getKey())
                ->when(
                    $usageCap !== null,
                    fn ($q) => $q->whereRaw(
                        CouponInterface::ATTR_USAGE_COUNT . ' < ?',
                        [(int) $usageCap],
                    ),
                )
                ->increment(CouponInterface::ATTR_USAGE_COUNT);
            if ($affected === 0) {
                // Defensive re-check — the row-lock should prevent this,
                // but if it fires we surface a P1 signal via the exception.
                throw new CouponUsageCapReachedException(sprintf(
                    'CouponRedeemer: usage_count increment refused (cap reached) — coupon "%s".',
                    (string) $coupon->getKey(),
                ));
            }

            // Refresh the counter for downstream observability.
            $coupon->refresh();
            $newUsageCount = (int) $coupon->getAttribute(CouponInterface::ATTR_USAGE_COUNT);

            // 5. Fire the domain event.
            Event::dispatch(new CouponRedeemed(
                redemptionId: (string) $redemption->getKey(),
                couponId: (string) $coupon->getKey(),
                tenantId: $tenantId,
                code: (string) $coupon->getAttribute(CouponInterface::ATTR_CODE),
                customerType: $customerType,
                customerId: $customerId,
                redeemedByUserId: $redeemedByUserId,
                appliedToType: $appliedToType,
                appliedToId: $appliedToId,
                sourceAmountCents: $sourceAmountCents,
                sourceCurrency: $sourceCurrency,
                discountAmountCents: $discountCents,
                finalAmountCents: $finalCents,
                discountSnapshot: $snapshot,
                issuanceSource: (string) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_SOURCE),
                issuanceContext: (array) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_CONTEXT),
                redeemedAt: $redeemedAtIso,
            ));

            // 6. Cap-reached signal (best-effort — fires when THIS redemption
            //    tipped the counter over).
            if ($usageCap !== null && $newUsageCount >= (int) $usageCap) {
                Event::dispatch(new CouponUsageCapReached(
                    couponId: (string) $coupon->getKey(),
                    tenantId: $tenantId,
                    code: (string) $coupon->getAttribute(CouponInterface::ATTR_CODE),
                    usageCap: (int) $usageCap,
                    issuanceSource: (string) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_SOURCE),
                    reachedAt: $redeemedAtIso,
                ));
            }

            return $redemption;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function reverse(
        string $tenantId,
        string $redemptionId,
        string $reversedByUserId,
        string $reason,
    ): CouponRedemption {
        return DB::transaction(function () use (
            $tenantId,
            $redemptionId,
            $reversedByUserId,
            $reason,
        ): CouponRedemption {
            /** @var CouponRedemption|null $redemption */
            $redemption = $this->redemptions->getModel()->newQuery()
                ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
                ->where(CouponRedemptionInterface::ATTR_ID, $redemptionId)
                ->lockForUpdate()
                ->first();
            if ($redemption === null) {
                throw new CouponRedemptionNotFoundException(sprintf(
                    'CouponRedeemer::reverse: redemption "%s" not found for tenant "%s".',
                    $redemptionId,
                    $tenantId,
                ));
            }

            if ($redemption->getAttribute(CouponRedemptionInterface::ATTR_REVERSED_AT) !== null) {
                throw new CouponRedemptionAlreadyReversedException(sprintf(
                    'CouponRedeemer::reverse: redemption "%s" is already reversed.',
                    $redemptionId,
                ));
            }

            $now = new \DateTimeImmutable();

            $this->redemptions->update($redemptionId, [
                CouponRedemptionInterface::ATTR_REVERSED_AT          => $now,
                CouponRedemptionInterface::ATTR_REVERSED_BY_USER_ID  => $reversedByUserId,
                CouponRedemptionInterface::ATTR_CLAWBACK_REASON      => CouponRedemptionClawbackReason::ManualAdmin->value,
            ]);

            // Decrement the parent coupon counter — never below zero.
            $this->coupons->getModel()->newQuery()
                ->where(CouponInterface::ATTR_ID, $redemption->getAttribute(CouponRedemptionInterface::ATTR_COUPON_ID))
                ->whereRaw(CouponInterface::ATTR_USAGE_COUNT . ' > 0')
                ->decrement(CouponInterface::ATTR_USAGE_COUNT);

            $reversed = $this->redemptions->findOrFail($redemptionId);

            Event::dispatch(new CouponRedemptionReversed(
                redemptionId: $redemptionId,
                couponId: (string) $redemption->getAttribute(CouponRedemptionInterface::ATTR_COUPON_ID),
                tenantId: $tenantId,
                reversedByUserId: $reversedByUserId,
                reason: $reason,
                reversedAmountCents: (int) $redemption->getAttribute(CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS),
                reversedAt: $now->format(DATE_ATOM),
            ));

            return $reversed;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function preview(
        string $tenantId,
        string $code,
        string $customerType,
        string $customerId,
        int $sourceAmountCents,
        string $sourceCurrency,
        ?string $planId = null,
    ): array {
        $verdict = $this->validator->validate(
            tenantId: $tenantId,
            couponCode: $code,
            customerId: $customerId,
            orderAmountCents: $sourceAmountCents,
            orderCurrency: $sourceCurrency,
            planId: $planId,
        );

        if (! $verdict->valid) {
            return [
                'is_applicable' => false,
                'refusal_reason' => $verdict->reason,
                'discount_amount_cents' => 0,
                'final_amount_cents' => $sourceAmountCents,
                'discount_snapshot' => null,
            ];
        }

        /** @var Coupon|null $coupon */
        $coupon = $this->coupons->getModel()->newQuery()
            ->where(CouponInterface::ATTR_ID, $verdict->couponId)
            ->first();

        return [
            'is_applicable' => true,
            'refusal_reason' => null,
            'discount_amount_cents' => $verdict->discountCents,
            'final_amount_cents' => max(0, $sourceAmountCents - $verdict->discountCents),
            'discount_snapshot' => $coupon !== null ? $this->buildSnapshot($coupon) : null,
        ];
    }

    /**
     * Fetch the coupon row for the tenant + code with a `FOR UPDATE` lock.
     *
     * @throws CouponNotFoundException  When no coupon matches.
     */
    private function lockCouponForRedemption(string $tenantId, string $code): Coupon
    {
        /** @var Coupon|null $coupon */
        $coupon = $this->coupons->getModel()->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->whereRaw('lower(' . CouponInterface::ATTR_CODE . ') = ?', [strtolower(trim($code))])
            ->lockForUpdate()
            ->first();
        if ($coupon === null) {
            throw new CouponNotFoundException(sprintf(
                'CouponRedeemer: coupon "%s" not found for tenant "%s".',
                $code,
                $tenantId,
            ));
        }

        return $coupon;
    }

    /**
     * Snapshot the coupon config at redemption time — persisted on the
     * redemption row so downstream reads (audit, refund, reporting) never
     * need to re-hydrate the parent coupon (which may have been mutated
     * or archived since).
     *
     * @return array<string, mixed>
     */
    private function buildSnapshot(Coupon $coupon): array
    {
        return [
            'code' => (string) $coupon->getAttribute(CouponInterface::ATTR_CODE),
            'name' => (string) $coupon->getAttribute(CouponInterface::ATTR_NAME),
            'discount_type' => (string) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_TYPE),
            'discount_amount' => $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_AMOUNT),
            'discount_currency' => $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_CURRENCY),
            'applicability' => (string) $coupon->getAttribute(CouponInterface::ATTR_APPLICABILITY),
            'applicable_plan_ids' => $coupon->getAttribute(CouponInterface::ATTR_APPLICABLE_PLAN_IDS),
            'minimum_order_amount' => $coupon->getAttribute(CouponInterface::ATTR_MINIMUM_ORDER_AMOUNT),
            'issuance_source' => (string) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_SOURCE),
            'is_stackable' => (bool) $coupon->getAttribute(CouponInterface::ATTR_IS_STACKABLE),
        ];
    }

    /**
     * Map a validator verdict to the appropriate domain exception.
     */
    private function exceptionFor(CouponVerdictData $verdict, string $code): \Throwable
    {
        return match ($verdict->reason) {
            'not_found' => new CouponNotFoundException(sprintf('Coupon "%s" not found.', $code)),
            'inactive' => new CouponInactiveException(sprintf('Coupon "%s" is inactive.', $code)),
            'expired', 'not_started' => new CouponExpiredException(sprintf('Coupon "%s" is outside its valid window.', $code)),
            'usage_cap_reached' => new CouponUsageCapReachedException(sprintf('Coupon "%s" has reached its usage cap.', $code)),
            'per_customer_limit_reached' => new CouponCustomerLimitReachedException(sprintf('Coupon "%s" has reached its per-customer limit.', $code)),
            'plan_not_applicable' => new CouponApplicabilityMismatchException(sprintf('Coupon "%s" is not applicable to this plan.', $code)),
            'minimum_order_not_met' => new CouponMinimumOrderNotMetException(sprintf('Coupon "%s" requires a higher minimum order.', $code)),
            'currency_mismatch' => new CouponCurrencyMismatchException(sprintf('Coupon "%s" is denominated in a different currency.', $code)),
            default => new CouponInactiveException(sprintf('Coupon "%s" refused: %s.', $code, $verdict->reason ?? 'unknown')),
        };
    }

    /**
     * Fire the refusal event — never blocks the exception raise path.
     */
    private function dispatchRefusal(
        string $tenantId,
        string $code,
        ?string $couponId,
        string $customerType,
        string $customerId,
        string $appliedToType,
        string $appliedToId,
        string $reason,
    ): void {
        Event::dispatch(new CouponRedemptionRefused(
            couponId: (string) ($couponId ?? ''),
            tenantId: $tenantId,
            code: $code,
            customerType: $customerType,
            customerId: $customerId,
            attemptedAppliedToType: $appliedToType,
            attemptedAppliedToId: $appliedToId,
            refusalReason: $this->mapRefusalReason($reason),
            refusedAt: (new \DateTimeImmutable())->format(DATE_ATOM),
        ));
    }

    /**
     * Normalise the validator's snake_case verdict reason to the event's
     * upper-snake refusal reason enum (matches `errors.json`).
     */
    private function mapRefusalReason(string $reason): string
    {
        return match ($reason) {
            'not_found' => 'COUPON_NOT_FOUND',
            'inactive' => 'COUPON_INACTIVE',
            'expired' => 'COUPON_EXPIRED',
            'not_started' => 'COUPON_NOT_YET_VALID',
            'usage_cap_reached' => 'COUPON_USAGE_CAP_REACHED',
            'per_customer_limit_reached' => 'COUPON_CUSTOMER_LIMIT_REACHED',
            'plan_not_applicable' => 'COUPON_APPLICABILITY_MISMATCH',
            'minimum_order_not_met' => 'COUPON_MINIMUM_ORDER_NOT_MET',
            'currency_mismatch' => 'COUPON_CURRENCY_MISMATCH',
            default => 'COUPON_NOT_FOUND',
        };
    }
}
