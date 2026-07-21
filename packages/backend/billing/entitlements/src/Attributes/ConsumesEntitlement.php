<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Attributes;

use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Attribute;

/**
 * Register a class as a consumer of one entitlement key.
 *
 * The build-time compiler discovers `#[ConsumesEntitlement]`-marked
 * classes via `Stackra\Foundation\Contracts\DiscoversAttributes`
 * and hands them to
 * {@see \Stackra\Entitlements\Services\EntitlementRegistry},
 * which stores the shipped default value + kind + period so tenant
 * provisioning can create the row with the right shape.
 *
 * ```php
 * #[ConsumesEntitlement(
 *     key: 'webhook.subscriptions.max',
 *     kind: EntitlementKind::Slot,
 *     defaultValue: ['limit' => 10, 'used' => 0],
 * )]
 * final class WebhookSubscription extends Model
 * {
 * }
 * ```
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class ConsumesEntitlement
{
    /**
     * @param  string                  $key           Dot-separated identifier (e.g. `webhook.subscriptions.max`).
     * @param  EntitlementKind         $kind          Measurement + enforcement kind.
     * @param  array<string, mixed>    $defaultValue  Kind-dependent default shape stored in `entitlements.value`.
     * @param  EntitlementPeriod|null  $period        Reset window for pool-kind rows. Null for slot / boolean / unlimited.
     */
    public function __construct(
        public string $key,
        public EntitlementKind $kind,
        public array $defaultValue,
        public ?EntitlementPeriod $period = null,
    ) {
    }
}
