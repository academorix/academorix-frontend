<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Data;

use Academorix\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Academorix\Entitlements\Models\EntitlementUsage;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see EntitlementUsage}.
 *
 * Append-only row — no writes to this shape. Correlation id is
 * carried through so downstream consumers can trace a consumption
 * back to the request that caused it.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class EntitlementUsageData extends Data
{
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $entitlementId,
        public string $key,
        public int $delta,
        public string $reason,
        public string $currentPeriodKey,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        public ?string $actorType = null,
        public ?string $actorId = null,
        public ?string $correlationId = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(EntitlementUsage $usage): self
    {
        return new self(
            id: (string) $usage->getKey(),
            tenantId: (string) $usage->{EntitlementUsageInterface::ATTR_TENANT_ID},
            entitlementId: (string) $usage->{EntitlementUsageInterface::ATTR_ENTITLEMENT_ID},
            key: (string) $usage->{EntitlementUsageInterface::ATTR_KEY},
            delta: (int) $usage->{EntitlementUsageInterface::ATTR_DELTA},
            reason: (string) $usage->{EntitlementUsageInterface::ATTR_REASON},
            currentPeriodKey: (string) $usage->{EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY},
            createdAt: $usage->{EntitlementUsageInterface::ATTR_CREATED_AT},
            actorType: $usage->{EntitlementUsageInterface::ATTR_ACTOR_TYPE},
            actorId: $usage->{EntitlementUsageInterface::ATTR_ACTOR_ID},
            correlationId: $usage->{EntitlementUsageInterface::ATTR_CORRELATION_ID},
        );
    }
}
