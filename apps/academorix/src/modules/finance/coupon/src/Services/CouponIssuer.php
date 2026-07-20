<?php

declare(strict_types=1);

namespace Academorix\Coupon\Services;

use Academorix\Coupon\Contracts\Data\CouponInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Academorix\Coupon\Contracts\Services\CodeGeneratorInterface;
use Academorix\Coupon\Contracts\Services\CouponIssuerInterface;
use Academorix\Coupon\Enums\CouponIssuanceSource;
use Academorix\Coupon\Events\CouponCreated;
use Academorix\Coupon\Events\CouponIssuedByReferralProgram;
use Academorix\Coupon\Events\CouponIssuedManually;
use Academorix\Coupon\Exceptions\CouponDuplicateActiveCodeException;
use Academorix\Coupon\Models\Coupon;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * Reference implementation of
 * {@see \Academorix\Coupon\Contracts\Services\CouponIssuerInterface}.
 *
 * Owns the create-side workflow — the write, the event dispatch, and
 * (for bulk / referral flows) the collision-free code generation.
 * Every method wraps the writes in `DB::transaction()` so listeners
 * of `ShouldDispatchAfterCommit` events never fire on a rolled-back
 * batch.
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class CouponIssuer implements CouponIssuerInterface
{
    public function __construct(
        private readonly CouponRepositoryInterface $coupons,
        private readonly CodeGeneratorInterface $codeGenerator,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function issueManually(string $tenantId, string $createdBy, array $attributes): Coupon
    {
        return DB::transaction(function () use ($tenantId, $createdBy, $attributes): Coupon {
            // The tenant guard: cross-tenant writes are rejected before the DB touch.
            $attributes[CouponInterface::ATTR_TENANT_ID] = $tenantId;
            $attributes[CouponInterface::ATTR_ISSUANCE_SOURCE] ??= CouponIssuanceSource::Manual->value;
            $attributes[CouponInterface::ATTR_USAGE_COUNT] ??= 0;
            $attributes[CouponInterface::ATTR_IS_ACTIVE] ??= true;
            $attributes[CouponInterface::ATTR_CREATED_BY] = $createdBy;

            $code = (string) $attributes[CouponInterface::ATTR_CODE];
            $this->assertCodeIsUniqueForTenant($tenantId, $code);

            /** @var Coupon $coupon */
            $coupon = $this->coupons->create($attributes);

            $now = (new \DateTimeImmutable())->format(DATE_ATOM);

            $this->dispatchCouponCreated($coupon, $tenantId, $createdBy);

            Event::dispatch(new CouponIssuedManually(
                couponId: (string) $coupon->getKey(),
                tenantId: $tenantId,
                code: (string) $coupon->getAttribute(CouponInterface::ATTR_CODE),
                issuanceSource: (string) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_SOURCE),
                issuanceContext: (array) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_CONTEXT),
                campaignName: (string) ($this->extractCampaignName($attributes) ?? ''),
                createdBy: $createdBy,
                issuedAt: $now,
            ));

            return $coupon;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function bulkIssue(
        string $tenantId,
        string $createdBy,
        int $count,
        array $template,
        ?string $codePrefix = null,
        int $codeLength = 10,
        ?string $campaignName = null,
    ): Collection {
        // Reject silly counts up front — the routes middleware also enforces
        // the entitlement quota, but a defensive guard here keeps the DB
        // from doing 10k roundtrips on an obvious mistake.
        if ($count < 1 || $count > 1000) {
            throw new \InvalidArgumentException(sprintf(
                'CouponIssuer::bulkIssue count out of range (%d) — expected 1..1000.',
                $count,
            ));
        }

        return DB::transaction(function () use (
            $tenantId,
            $createdBy,
            $count,
            $template,
            $codePrefix,
            $codeLength,
            $campaignName,
        ): Collection {
            $issued = new Collection();

            $context = (array) ($template[CouponInterface::ATTR_ISSUANCE_CONTEXT] ?? []);
            if ($campaignName !== null && $campaignName !== '') {
                $context['campaign_name'] = $campaignName;
            }

            for ($i = 0; $i < $count; $i++) {
                $code = $this->codeGenerator->generate($tenantId, $codeLength, (string) $codePrefix);

                $attributes = $template;
                $attributes[CouponInterface::ATTR_CODE] = $code;
                $attributes[CouponInterface::ATTR_ISSUANCE_SOURCE] ??= CouponIssuanceSource::MarketingCampaign->value;
                $attributes[CouponInterface::ATTR_ISSUANCE_CONTEXT] = $context;

                $issued->push($this->issueManually($tenantId, $createdBy, $attributes));
            }

            return $issued;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function issueForReferral(
        string $tenantId,
        string $referralProgramId,
        string $referralId,
        string $referralRewardId,
        string $recipientRole,
        string $recipientUserId,
        array $template,
    ): Coupon {
        return DB::transaction(function () use (
            $tenantId,
            $referralProgramId,
            $referralId,
            $referralRewardId,
            $recipientRole,
            $recipientUserId,
            $template,
        ): Coupon {
            // Referral-issued coupons always generate their code — the
            // caller can never author its own referral coupon code.
            $code = $this->codeGenerator->generate($tenantId, 10, 'REF-');

            $context = [
                'referral_program_id' => $referralProgramId,
                'referral_id' => $referralId,
                'referral_reward_id' => $referralRewardId,
                'recipient_role' => $recipientRole,
                'recipient_user_id' => $recipientUserId,
            ];

            $attributes = $template;
            $attributes[CouponInterface::ATTR_TENANT_ID] = $tenantId;
            $attributes[CouponInterface::ATTR_CODE] = $code;
            $attributes[CouponInterface::ATTR_ISSUANCE_SOURCE] = CouponIssuanceSource::Referral->value;
            $attributes[CouponInterface::ATTR_ISSUANCE_CONTEXT] = $context;
            $attributes[CouponInterface::ATTR_USAGE_COUNT] ??= 0;
            $attributes[CouponInterface::ATTR_PER_CUSTOMER_LIMIT] ??= 1;
            $attributes[CouponInterface::ATTR_IS_ACTIVE] ??= true;
            $attributes[CouponInterface::ATTR_CREATED_BY] = $recipientUserId;

            /** @var Coupon $coupon */
            $coupon = $this->coupons->create($attributes);

            $now = (new \DateTimeImmutable())->format(DATE_ATOM);

            $this->dispatchCouponCreated($coupon, $tenantId, $recipientUserId);

            Event::dispatch(new CouponIssuedByReferralProgram(
                couponId: (string) $coupon->getKey(),
                tenantId: $tenantId,
                code: $code,
                referralProgramId: $referralProgramId,
                referralId: $referralId,
                referralRewardId: $referralRewardId,
                recipientRole: $recipientRole,
                recipientUserId: $recipientUserId,
                discountType: (string) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_TYPE),
                discountAmount: (string) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_AMOUNT),
                issuedAt: $now,
            ));

            return $coupon;
        });
    }

    /**
     * Dispatch the generic `CouponCreated` event with the model's
     * post-persist state. The event's constructor is non-nullable across
     * every field so we cast missing values to `''` / `0` — matching the
     * blueprint payload contract (fields absent on the model surface as
     * empty in the wire payload).
     */
    private function dispatchCouponCreated(Coupon $coupon, string $tenantId, string $createdBy): void
    {
        Event::dispatch(new CouponCreated(
            couponId: (string) $coupon->getKey(),
            tenantId: $tenantId,
            code: (string) $coupon->getAttribute(CouponInterface::ATTR_CODE),
            name: (string) $coupon->getAttribute(CouponInterface::ATTR_NAME),
            discountType: (string) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_TYPE),
            discountAmount: (string) ($coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_AMOUNT) ?? ''),
            discountCurrency: (string) ($coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_CURRENCY) ?? ''),
            applicability: (string) $coupon->getAttribute(CouponInterface::ATTR_APPLICABILITY),
            issuanceSource: (string) $coupon->getAttribute(CouponInterface::ATTR_ISSUANCE_SOURCE),
            validFrom: $this->toIso8601($coupon->getAttribute(CouponInterface::ATTR_VALID_FROM)),
            validUntil: $this->toIso8601($coupon->getAttribute(CouponInterface::ATTR_VALID_UNTIL)),
            usageCap: (int) ($coupon->getAttribute(CouponInterface::ATTR_USAGE_CAP) ?? 0),
            perCustomerLimit: (int) ($coupon->getAttribute(CouponInterface::ATTR_PER_CUSTOMER_LIMIT) ?? 0),
            isStackable: (bool) $coupon->getAttribute(CouponInterface::ATTR_IS_STACKABLE),
            createdBy: $createdBy,
        ));
    }

    /**
     * Coerce a value to an ISO-8601 string — accepts `DateTimeInterface`,
     * strings, or null (returned as `''` since the event constructor is
     * non-nullable).
     */
    private function toIso8601(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        if (is_string($value) && $value !== '') {
            return $value;
        }

        return '';
    }

    /**
     * Enforce the "one active code per (tenant, code)" invariant BEFORE
     * hitting the DB unique index — surfaces a domain exception instead of
     * a QueryException.
     *
     * @throws CouponDuplicateActiveCodeException
     */
    private function assertCodeIsUniqueForTenant(string $tenantId, string $code): void
    {
        $exists = $this->coupons
            ->getModel()
            ->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->whereRaw('lower(' . CouponInterface::ATTR_CODE . ') = ?', [strtolower($code)])
            ->where(CouponInterface::ATTR_IS_ACTIVE, true)
            ->exists();

        if ($exists) {
            throw new CouponDuplicateActiveCodeException(sprintf(
                'CouponIssuer: coupon code "%s" is already active for tenant "%s".',
                $code,
                $tenantId,
            ));
        }
    }

    /**
     * Extract the campaign_name from either the top-level attribute or the
     * `issuance_context` bag. Bulk-issue writes it into the context; a manual
     * "campaign_name" prop mirrors it up for the event payload.
     */
    private function extractCampaignName(array $attributes): ?string
    {
        if (isset($attributes['campaign_name']) && is_string($attributes['campaign_name'])) {
            return $attributes['campaign_name'];
        }

        $context = (array) ($attributes[CouponInterface::ATTR_ISSUANCE_CONTEXT] ?? []);
        if (isset($context['campaign_name']) && is_string($context['campaign_name'])) {
            return $context['campaign_name'];
        }

        return null;
    }
}
