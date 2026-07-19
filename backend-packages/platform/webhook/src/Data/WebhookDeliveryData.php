<?php

declare(strict_types=1);

namespace Academorix\Webhook\Data;

use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Enums\WebhookDeliveryStatus;
use Academorix\Webhook\Models\WebhookDelivery;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see WebhookDelivery}.
 *
 * The payload itself is REDACTED — the encrypted-at-rest column is
 * omitted from the wire. Consumers see the metadata (status, latency,
 * attempt count) + a payload hash for correlation.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class WebhookDeliveryData extends Data
{
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $subscriptionId,
        public string $eventName,
        public string $payloadHash,
        public int $attempt,
        public WebhookDeliveryStatus $status,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $eventId = null,
        public ?string $apiVersion = null,
        public ?int $httpStatusCode = null,
        public ?int $latencyMs = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $dispatchedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deliveredAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $failedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $retryAt = null,
        public ?string $errorMessage = null,
    ) {
    }

    /**
     * Build from a Model. Redacts the payload; consumers use the
     * `payload_hash` for correlation.
     */
    public static function fromModel(WebhookDelivery $delivery): self
    {
        $rawStatus = $delivery->{WebhookDeliveryInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof WebhookDeliveryStatus
            ? $rawStatus
            : (WebhookDeliveryStatus::tryFrom((string) $rawStatus) ?? WebhookDeliveryStatus::Pending);

        return new self(
            id: (string) $delivery->getKey(),
            tenantId: (string) $delivery->{WebhookDeliveryInterface::ATTR_TENANT_ID},
            subscriptionId: (string) $delivery->{WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID},
            eventName: (string) $delivery->{WebhookDeliveryInterface::ATTR_EVENT_NAME},
            payloadHash: (string) $delivery->{WebhookDeliveryInterface::ATTR_PAYLOAD_HASH},
            attempt: (int) $delivery->{WebhookDeliveryInterface::ATTR_ATTEMPT},
            status: $status,
            createdAt: $delivery->{WebhookDeliveryInterface::ATTR_CREATED_AT},
            updatedAt: $delivery->{WebhookDeliveryInterface::ATTR_UPDATED_AT},
            eventId: $delivery->{WebhookDeliveryInterface::ATTR_EVENT_ID},
            apiVersion: $delivery->{WebhookDeliveryInterface::ATTR_API_VERSION},
            httpStatusCode: $delivery->{WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE},
            latencyMs: $delivery->{WebhookDeliveryInterface::ATTR_LATENCY_MS},
            dispatchedAt: $delivery->{WebhookDeliveryInterface::ATTR_DISPATCHED_AT},
            deliveredAt: $delivery->{WebhookDeliveryInterface::ATTR_DELIVERED_AT},
            failedAt: $delivery->{WebhookDeliveryInterface::ATTR_FAILED_AT},
            retryAt: $delivery->{WebhookDeliveryInterface::ATTR_RETRY_AT},
            errorMessage: $delivery->{WebhookDeliveryInterface::ATTR_ERROR_MESSAGE},
        );
    }
}
