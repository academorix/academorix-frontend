<?php

declare(strict_types=1);

namespace Academorix\Subscription\Data;

use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Enums\SubscriptionEventActor;
use Academorix\Subscription\Enums\SubscriptionEventKind;
use Academorix\Subscription\Models\SubscriptionEvent;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SubscriptionEvent}.
 *
 * The raw `payload` blob is stripped from the tenant-audience
 * response — it may reference the provider's customer email,
 * billing address, and tax IDs. Platform-admin actions surface the
 * blob via a different code path (see
 * {@see \Academorix\Subscription\Actions\Platform\ShowSubscription}).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SubscriptionEventData extends Data
{
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $subscriptionId,
        public SubscriptionEventKind $kind,
        public SubscriptionEventActor $actorType,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $occurredAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        public ?string $fromState = null,
        public ?string $toState = null,
        public ?string $fromPlanId = null,
        public ?string $toPlanId = null,
        public ?int $amountMicroUnits = null,
        public ?string $currency = null,
        public ?string $actorId = null,
        public ?string $reason = null,
    ) {
    }

    /**
     * Build the DTO from a SubscriptionEvent model.
     */
    public static function fromModel(SubscriptionEvent $event): self
    {
        $kind = $event->{SubscriptionEventInterface::ATTR_KIND};
        $kind = $kind instanceof SubscriptionEventKind
            ? $kind
            : (SubscriptionEventKind::tryFrom((string) $kind) ?? SubscriptionEventKind::Started);

        $actor = $event->{SubscriptionEventInterface::ATTR_ACTOR_TYPE};
        $actor = $actor instanceof SubscriptionEventActor
            ? $actor
            : (SubscriptionEventActor::tryFrom((string) $actor) ?? SubscriptionEventActor::System);

        return new self(
            id: (string) $event->getKey(),
            tenantId: (string) $event->{SubscriptionEventInterface::ATTR_TENANT_ID},
            subscriptionId: (string) $event->{SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID},
            kind: $kind,
            actorType: $actor,
            occurredAt: $event->{SubscriptionEventInterface::ATTR_OCCURRED_AT},
            createdAt: $event->{SubscriptionEventInterface::ATTR_CREATED_AT},
            fromState: self::nullableString($event, SubscriptionEventInterface::ATTR_FROM_STATE),
            toState: self::nullableString($event, SubscriptionEventInterface::ATTR_TO_STATE),
            fromPlanId: self::nullableString($event, SubscriptionEventInterface::ATTR_FROM_PLAN_ID),
            toPlanId: self::nullableString($event, SubscriptionEventInterface::ATTR_TO_PLAN_ID),
            amountMicroUnits: self::nullableInt($event, SubscriptionEventInterface::ATTR_AMOUNT_MICRO_UNITS),
            currency: self::nullableString($event, SubscriptionEventInterface::ATTR_CURRENCY),
            actorId: self::nullableString($event, SubscriptionEventInterface::ATTR_ACTOR_ID),
            reason: self::nullableString($event, SubscriptionEventInterface::ATTR_REASON),
        );
    }

    /**
     * Read a nullable string attribute.
     */
    private static function nullableString(SubscriptionEvent $event, string $key): ?string
    {
        $value = $event->{$key} ?? null;
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Read a nullable integer attribute.
     */
    private static function nullableInt(SubscriptionEvent $event, string $key): ?int
    {
        $value = $event->{$key} ?? null;
        if ($value === null) {
            return null;
        }

        return (int) $value;
    }
}
