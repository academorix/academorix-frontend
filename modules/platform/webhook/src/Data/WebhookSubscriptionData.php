<?php

declare(strict_types=1);

namespace Academorix\Webhook\Data;

use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Enums\WebhookProbeStatus;
use Academorix\Webhook\Enums\WebhookSubscriptionStatus;
use Academorix\Webhook\Models\WebhookSubscription;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see WebhookSubscription}.
 *
 * NEVER carries the signing secret or destination-config secrets —
 * the model layer hides `signing_secret` + `signing_secret_previous`
 * already, and this DTO reinforces the boundary by omitting them
 * entirely. Destination config carries a redacted flag list so
 * consumers see WHICH keys are set without seeing their values.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class WebhookSubscriptionData extends Data
{
    /**
     * @param  list<string>            $events                 Subscribed events.
     * @param  list<string>            $destinationConfigKeys  Keys present in `destination_config` (values redacted).
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $name,
        public string $destination,
        public array $events,
        public array $destinationConfigKeys,
        public WebhookSubscriptionStatus $status,
        public int $consecutiveFailures,
        public int $rateLimitPerMinute,
        public string $backoffStrategy,
        public WebhookProbeStatus $healthProbeStatus,
        public bool $hasRotationGrace,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $apiVersion = null,
        public ?string $disabledReason = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $disabledAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastDeliveryAt = null,
        public ?string $healthProbeUrl = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $healthProbeLastAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $signingSecretRotatedAt = null,
    ) {
    }

    /**
     * Build from a Model. Redacts every secret on the way out.
     */
    public static function fromModel(WebhookSubscription $subscription): self
    {
        $rawStatus = $subscription->{WebhookSubscriptionInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof WebhookSubscriptionStatus
            ? $rawStatus
            : (WebhookSubscriptionStatus::tryFrom((string) $rawStatus) ?? WebhookSubscriptionStatus::Active);

        $rawProbe = $subscription->{WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_STATUS};
        $probe    = $rawProbe instanceof WebhookProbeStatus
            ? $rawProbe
            : (WebhookProbeStatus::tryFrom((string) $rawProbe) ?? WebhookProbeStatus::Unknown);

        $config = $subscription->{WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG} ?? [];
        $keys   = \is_array($config) ? \array_keys($config) : [];

        $events = $subscription->{WebhookSubscriptionInterface::ATTR_EVENTS} ?? [];
        if (! \is_array($events)) {
            $events = [];
        }

        return new self(
            id: (string) $subscription->getKey(),
            tenantId: (string) $subscription->{WebhookSubscriptionInterface::ATTR_TENANT_ID},
            name: (string) $subscription->{WebhookSubscriptionInterface::ATTR_NAME},
            destination: (string) $subscription->{WebhookSubscriptionInterface::ATTR_DESTINATION},
            events: \array_values($events),
            destinationConfigKeys: \array_map('strval', \array_values($keys)),
            status: $status,
            consecutiveFailures: (int) $subscription->{WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES},
            rateLimitPerMinute: (int) $subscription->{WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE},
            backoffStrategy: (string) $subscription->{WebhookSubscriptionInterface::ATTR_BACKOFF_STRATEGY},
            healthProbeStatus: $probe,
            hasRotationGrace: $subscription->hasRotationGrace(),
            createdAt: $subscription->{WebhookSubscriptionInterface::ATTR_CREATED_AT},
            updatedAt: $subscription->{WebhookSubscriptionInterface::ATTR_UPDATED_AT},
            apiVersion: $subscription->{WebhookSubscriptionInterface::ATTR_API_VERSION},
            disabledReason: $subscription->{WebhookSubscriptionInterface::ATTR_DISABLED_REASON},
            disabledAt: $subscription->{WebhookSubscriptionInterface::ATTR_DISABLED_AT},
            lastDeliveryAt: $subscription->{WebhookSubscriptionInterface::ATTR_LAST_DELIVERY_AT},
            healthProbeUrl: $subscription->{WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_URL},
            healthProbeLastAt: $subscription->{WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT},
            signingSecretRotatedAt: $subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT},
        );
    }
}
