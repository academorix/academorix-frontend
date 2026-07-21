<?php

declare(strict_types=1);

namespace Stackra\Notifications\Data;

use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Models\NotificationDelivery;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see NotificationDelivery}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationDeliveryData extends Data
{
    /**
     * @param  string                    $id                   `delv_<ulid>`.
     * @param  string                    $tenantId             Owning tenant.
     * @param  string                    $notificationId       Parent notification id.
     * @param  NotificationChannel       $channel              Delivery channel.
     * @param  string|null               $provider             Provider used.
     * @param  string|null               $providerMessageId    Provider-issued id.
     * @param  NotificationStatus        $state                Lifecycle state.
     * @param  int                       $attempt              Attempt counter.
     * @param  \DateTimeInterface|null   $attemptedAt          When the send was attempted.
     * @param  \DateTimeInterface|null   $deliveredAt          When delivery was confirmed.
     * @param  \DateTimeInterface|null   $failedAt             When the delivery failed.
     * @param  string|null               $errorCode            Error code (if any).
     * @param  string|null               $errorMessage         Error message (if any).
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $notificationId,
        public NotificationChannel $channel,
        public ?string $provider,
        public ?string $providerMessageId,
        public NotificationStatus $state,
        public int $attempt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $attemptedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deliveredAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $failedAt = null,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
    ) {
    }

    /**
     * Build the DTO from a NotificationDelivery model.
     */
    public static function fromModel(NotificationDelivery $delivery): self
    {
        $channelValue = $delivery->{NotificationDeliveryInterface::ATTR_CHANNEL};
        $channel = $channelValue instanceof NotificationChannel
            ? $channelValue
            : (NotificationChannel::tryFrom((string) $channelValue) ?? NotificationChannel::InApp);

        $stateValue = $delivery->{NotificationDeliveryInterface::ATTR_STATE};
        $state = $stateValue instanceof NotificationStatus
            ? $stateValue
            : (NotificationStatus::tryFrom((string) $stateValue) ?? NotificationStatus::Queued);

        return new self(
            id: (string) $delivery->getKey(),
            tenantId: (string) $delivery->{NotificationDeliveryInterface::ATTR_TENANT_ID},
            notificationId: (string) $delivery->{NotificationDeliveryInterface::ATTR_NOTIFICATION_ID},
            channel: $channel,
            provider: $delivery->{NotificationDeliveryInterface::ATTR_PROVIDER},
            providerMessageId: $delivery->{NotificationDeliveryInterface::ATTR_PROVIDER_MESSAGE_ID},
            state: $state,
            attempt: (int) $delivery->{NotificationDeliveryInterface::ATTR_ATTEMPT},
            attemptedAt: $delivery->{NotificationDeliveryInterface::ATTR_ATTEMPTED_AT},
            deliveredAt: $delivery->{NotificationDeliveryInterface::ATTR_DELIVERED_AT},
            failedAt: $delivery->{NotificationDeliveryInterface::ATTR_FAILED_AT},
            errorCode: $delivery->{NotificationDeliveryInterface::ATTR_ERROR_CODE},
            errorMessage: $delivery->{NotificationDeliveryInterface::ATTR_ERROR_MESSAGE},
        );
    }
}
