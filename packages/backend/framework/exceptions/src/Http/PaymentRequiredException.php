<?php

/**
 * @file packages/exceptions/src/Http/PaymentRequiredException.php
 *
 * @description
 * HTTP 402 — a billing / plan / seat / balance constraint blocks the
 * request. The caller is authenticated and permitted to perform the
 * action in general — their subscription just doesn't cover this
 * specific instance.
 *
 * Clients should route this response to the billing portal / upgrade
 * flow rather than a permissions-error toast.
 *
 * ## Named factories
 *
 *   - {@see seatLimitReached()}    — team hit its per-plan seat cap.
 *   - {@see planUpgradeRequired()} — feature requires a paid tier.
 *   - {@see insufficientBalance()} — pay-as-you-go / credits ran out.
 *
 * ## Translation keys
 *
 *   exceptions::http.payment_required                       (class default)
 *   exceptions::http.payment_required_seat_limit            ({@see seatLimitReached()})
 *   exceptions::http.payment_required_upgrade               ({@see planUpgradeRequired()})
 *   exceptions::http.payment_required_insufficient_balance  ({@see insufficientBalance()})
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see \Academorix\Exceptions\Auth\FeatureDisabledException  Sibling class for feature-flag denials.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class PaymentRequiredException extends AcademorixException
{
    /**
     * Machine-readable code exposed on the wire — clients that
     * route 402s to a billing portal branch on this literal. Treat
     * as public API.
     */
    public const CODE = 'billing.payment_required';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → payment_required`. Named factories
     * override with more specific keys.
     */
    public const TRANSLATION_KEY = 'exceptions::http.payment_required';

    /**
     * `Info` severity — billing gates are expected user flow, not
     * an ops signal.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * Dedicated `Billing` category — separate from `Authorization`
     * / `FeatureFlag` so product analytics can chart plan-gate
     * traffic as its own signal (typically the primary funnel
     * metric for upgrade flows).
     */
    protected ErrorCategory $category = ErrorCategory::Billing;

    /**
     * 402 — the standard "payment required" status. Rare in HTTP
     * generally, but SaaS pricing gates fit it precisely.
     */
    protected int $httpStatus = Response::HTTP_PAYMENT_REQUIRED;

    /**
     * Named factory: team is at its seat cap for the current plan.
     *
     * Seat count goes into context AND the translation parameters
     * so upgrade CTAs can show the user their current cap.
     *
     * @param  int  $limit  The current plan's seat cap. Retained in
     *                      both context (`seat_limit`) and
     *                      translation parameters (`:limit`).
     * @return static The fluent instance with the more specific
     *                `payment_required_seat_limit` translation
     *                key applied.
     */
    public static function seatLimitReached(int $limit): static
    {
        return static::make("Seat limit ({$limit}) reached.")
            ->withContext(['seat_limit' => $limit])
            ->withTranslationParameters(['limit' => $limit])
            ->withTranslationKey('exceptions::http.payment_required_seat_limit');
    }

    /**
     * Named factory: feature is behind a paid plan.
     *
     * `$requiredPlan` should match one of the plan identifiers used
     * by the billing system ("pro", "enterprise") so clients can
     * link straight to the upgrade page for that tier.
     *
     * @param  string  $requiredPlan  Billing-system plan identifier
     *                                required to unlock the
     *                                feature. Retained in context
     *                                (`required_plan`) and
     *                                translation parameters
     *                                (`:plan`).
     * @return static The fluent instance carrying the plan
     *                identifier in both context and translation
     *                parameters, with the `payment_required_upgrade`
     *                translation key applied.
     */
    public static function planUpgradeRequired(string $requiredPlan): static
    {
        return static::make("Plan upgrade required: {$requiredPlan}.")
            ->withContext(['required_plan' => $requiredPlan])
            ->withTranslationParameters(['plan' => $requiredPlan])
            ->withTranslationKey('exceptions::http.payment_required_upgrade');
    }

    /**
     * Named factory: pay-as-you-go balance is below what this
     * action would cost.
     *
     * Amounts are in cents (integer) to avoid float rounding drift.
     * The user message deliberately does NOT expose the exact
     * shortfall — that's a billing concern, not an error concern —
     * but the values are in context for the billing service.
     *
     * @param  int  $requiredCents  Cost of the requested action, in
     *                              the smallest currency unit
     *                              (cents / pence / öre).
     * @param  int  $currentCents   The account's current balance in
     *                              the same unit. Not exposed to
     *                              the user by default.
     * @return static The fluent instance with both amounts in
     *                context and the
     *                `payment_required_insufficient_balance`
     *                translation key applied.
     */
    public static function insufficientBalance(int $requiredCents, int $currentCents): static
    {
        return static::make('Insufficient account balance.')
            ->withContext([
                'required_cents' => $requiredCents,
                'current_cents' => $currentCents,
            ])
            ->withTranslationKey('exceptions::http.payment_required_insufficient_balance');
    }
}
