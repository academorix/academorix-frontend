<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Attributes;

use Attribute;

/**
 * Mark a method as auto-enforcing an entitlement before invocation.
 *
 * The `MetersUsage` trait reads this attribute on the target model's
 * `saving` observer path — every save that violates the entitlement
 * raises `EntitlementExceededException` before Eloquent writes the
 * row.
 *
 * ```php
 * #[EnforcesEntitlement(key: 'webhook.subscriptions.max', amount: 1)]
 * public function save(): bool
 * {
 *     return parent::save();
 * }
 * ```
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_METHOD)]
final readonly class EnforcesEntitlement
{
    /**
     * @param  string  $key     Dot-separated identifier.
     * @param  int     $amount  Units the invocation consumes (default 1).
     */
    public function __construct(
        public string $key,
        public int $amount = 1,
    ) {
    }
}
