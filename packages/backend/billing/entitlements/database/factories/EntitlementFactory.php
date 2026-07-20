<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Database\Factories;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Enums\EntitlementKind;
use Academorix\Entitlements\Enums\EntitlementPeriod;
use Academorix\Entitlements\Enums\EntitlementSource;
use Academorix\Entitlements\Models\Entitlement;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Entitlement}.
 *
 * Default: pool-kind, monthly, `{limit: 100, used: 0}`. States cover
 * the other three kinds plus an `exceeded` state that pushes `used`
 * past `limit` for testing the enforcer's reject path.
 *
 * @extends Factory<Entitlement>
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementFactory extends Factory
{
    /**
     * @var class-string<Entitlement>
     */
    protected $model = Entitlement::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            EntitlementInterface::ATTR_ID                       => 'ent_' . Str::ulid()->toBase32(),
            EntitlementInterface::ATTR_TENANT_ID                => 'ten_' . Str::ulid()->toBase32(),
            EntitlementInterface::ATTR_KEY                      => 'demo.pool.month',
            EntitlementInterface::ATTR_KIND                     => EntitlementKind::Pool->value,
            EntitlementInterface::ATTR_VALUE                    => ['limit' => 100, 'used' => 0],
            EntitlementInterface::ATTR_PERIOD                   => EntitlementPeriod::Monthly->value,
            EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => \now(),
            EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => \now()->addMonth()->startOfMonth(),
            EntitlementInterface::ATTR_SOURCE                   => EntitlementSource::Plan->value,
        ];
    }

    /**
     * Slot-kind state — hard cap on concurrent count.
     */
    public function slot(): static
    {
        return $this->state(fn (): array => [
            EntitlementInterface::ATTR_KEY                      => 'demo.slots.max',
            EntitlementInterface::ATTR_KIND                     => EntitlementKind::Slot->value,
            EntitlementInterface::ATTR_VALUE                    => ['limit' => 10, 'used' => 0],
            EntitlementInterface::ATTR_PERIOD                   => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => null,
        ]);
    }

    /**
     * Boolean-kind state — feature toggle.
     */
    public function boolean(): static
    {
        return $this->state(fn (): array => [
            EntitlementInterface::ATTR_KEY                      => 'demo.feature.enabled',
            EntitlementInterface::ATTR_KIND                     => EntitlementKind::Boolean->value,
            EntitlementInterface::ATTR_VALUE                    => ['enabled' => true],
            EntitlementInterface::ATTR_PERIOD                   => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => null,
        ]);
    }

    /**
     * Unlimited-kind state — enterprise sentinel.
     */
    public function unlimited(): static
    {
        return $this->state(fn (): array => [
            EntitlementInterface::ATTR_KEY                      => 'demo.enterprise.unlimited',
            EntitlementInterface::ATTR_KIND                     => EntitlementKind::Unlimited->value,
            EntitlementInterface::ATTR_VALUE                    => [],
            EntitlementInterface::ATTR_PERIOD                   => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => null,
            EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => null,
        ]);
    }

    /**
     * Exceeded state — `used` pushed past `limit` for testing the
     * enforcer's reject path.
     */
    public function exceeded(): static
    {
        return $this->state(fn (): array => [
            EntitlementInterface::ATTR_VALUE => ['limit' => 10, 'used' => 15],
        ]);
    }
}
