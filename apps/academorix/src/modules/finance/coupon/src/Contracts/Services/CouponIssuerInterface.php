<?php

declare(strict_types=1);

namespace Stackra\Coupon\Contracts\Services;

use Stackra\Coupon\Models\Coupon;
use Stackra\Coupon\Services\CouponIssuer;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Contract for the coupon issuance service.
 *
 * Owns the write path for creating coupons under known issuance
 * sources (`manual`, `referral`, `marketing_campaign`, `import`,
 * `api`). Every method wraps the DB write + the domain event
 * dispatch in a single transaction so listeners never fire on a
 * rolled-back write.
 *
 * Concrete: {@see CouponIssuer}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(CouponIssuer::class)]
interface CouponIssuerInterface
{
    /**
     * Issue a single coupon with `issuance_source = 'manual'`.
     *
     * Fires `CouponCreated` + `CouponIssuedManually`.
     *
     * @param  string               $tenantId    Owning tenant.
     * @param  string               $createdBy   User id who authored the coupon.
     * @param  array<string, mixed> $attributes  Coupon config — `code`, `name`,
     *                                           `discount_type`, `discount_amount`,
     *                                           `applicability`, `valid_from`,
     *                                           `usage_cap`, `per_customer_limit`,
     *                                           ...
     *
     * @return Coupon The persisted coupon row.
     */
    public function issueManually(string $tenantId, string $createdBy, array $attributes): Coupon;

    /**
     * Bulk-issue `$count` coupons — one row per generated code, sharing the
     * remaining `$template` attributes.
     *
     * Delegates code generation to `CodeGenerator`. Wraps every write inside a
     * single transaction — if the `count`-th write fails, every prior write is
     * rolled back. Fires `CouponCreated` + `CouponIssuedManually`
     * per row on commit.
     *
     * @param  string               $tenantId       Owning tenant.
     * @param  string               $createdBy      User id who authored the batch.
     * @param  int                  $count          Number of codes to generate (1..1000).
     * @param  array<string, mixed> $template       Shared coupon config.
     * @param  string|null          $codePrefix     Optional prefix (`SUMMER2026-`).
     * @param  int                  $codeLength     Length of the random portion.
     * @param  string|null          $campaignName   Marketing campaign label stored in `issuance_context.campaign_name`.
     *
     * @return Collection<int, Coupon>  Every created coupon, keyed by index.
     */
    public function bulkIssue(
        string $tenantId,
        string $createdBy,
        int $count,
        array $template,
        ?string $codePrefix = null,
        int $codeLength = 10,
        ?string $campaignName = null,
    ): Collection;

    /**
     * Issue a coupon associated with a referral reward.
     *
     * Fires `CouponCreated` + `CouponIssuedByReferralProgram`.
     *
     * @param  string               $tenantId          Owning tenant.
     * @param  string               $referralProgramId Program the reward belongs to.
     * @param  string               $referralId        Referral being rewarded.
     * @param  string               $referralRewardId  Reward row triggering issuance.
     * @param  string               $recipientRole     `referrer` or `referred`.
     * @param  string               $recipientUserId   User to whom the coupon is issued.
     * @param  array<string, mixed> $template          Discount config.
     *
     * @return Coupon
     */
    public function issueForReferral(
        string $tenantId,
        string $referralProgramId,
        string $referralId,
        string $referralRewardId,
        string $recipientRole,
        string $recipientUserId,
        array $template,
    ): Coupon;
}
