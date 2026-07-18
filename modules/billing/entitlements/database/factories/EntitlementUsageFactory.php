<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Database\Factories;

use Academorix\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Academorix\Entitlements\Models\EntitlementUsage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see EntitlementUsage}.
 *
 * Default: `delta = 1`, current-month period key. States cover
 * refunds (`delta = -1`) and multi-unit consumption.
 *
 * @extends Factory<EntitlementUsage>
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementUsageFactory extends Factory
{
    /**
     * @var class-string<EntitlementUsage>
     */
    protected $model = EntitlementUsage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            EntitlementUsageInterface::ATTR_ID                 => 'usg_' . Str::ulid()->toBase32(),
            EntitlementUsageInterface::ATTR_TENANT_ID          => 'ten_' . Str::ulid()->toBase32(),
            EntitlementUsageInterface::ATTR_ENTITLEMENT_ID     => 'ent_' . Str::ulid()->toBase32(),
            EntitlementUsageInterface::ATTR_KEY                => 'demo.pool.month',
            EntitlementUsageInterface::ATTR_DELTA              => 1,
            EntitlementUsageInterface::ATTR_REASON             => 'consumption',
            EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY => \now()->format('Y-m'),
        ];
    }

    /**
     * Refund state — negative delta.
     */
    public function refund(): static
    {
        return $this->state(fn (): array => [
            EntitlementUsageInterface::ATTR_DELTA  => -1,
            EntitlementUsageInterface::ATTR_REASON => 'refund',
        ]);
    }
}
