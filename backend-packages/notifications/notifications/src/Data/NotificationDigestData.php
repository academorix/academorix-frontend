<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data;

use Academorix\Notifications\Contracts\Data\NotificationDigestInterface;
use Academorix\Notifications\Enums\DigestState;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Notifications\Models\NotificationDigest;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see NotificationDigest}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationDigestData extends Data
{
    /**
     * @param  string                    $id                 `dgst_<ulid>`.
     * @param  string                    $tenantId           Owning tenant.
     * @param  string                    $userId             Owning user.
     * @param  string                    $categorySlug       Category slug.
     * @param  NotificationChannel       $channel            Channel key.
     * @param  DigestState               $state              Lifecycle state.
     * @param  \DateTimeInterface        $scheduledFor       Delivery boundary.
     * @param  \DateTimeInterface|null   $deliveredAt        Delivery timestamp.
     * @param  list<string>              $notificationIds    Included notification ids.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $userId,
        public string $categorySlug,
        public NotificationChannel $channel,
        public DigestState $state,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $scheduledFor,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deliveredAt = null,
        public array $notificationIds = [],
    ) {
    }

    /**
     * Build the DTO from a NotificationDigest model.
     */
    public static function fromModel(NotificationDigest $digest): self
    {
        $channelValue = $digest->{NotificationDigestInterface::ATTR_CHANNEL};
        $channel = $channelValue instanceof NotificationChannel
            ? $channelValue
            : (NotificationChannel::tryFrom((string) $channelValue) ?? NotificationChannel::Mail);

        $stateValue = $digest->{NotificationDigestInterface::ATTR_STATE};
        $state = $stateValue instanceof DigestState
            ? $stateValue
            : (DigestState::tryFrom((string) $stateValue) ?? DigestState::Pending);

        return new self(
            id: (string) $digest->getKey(),
            tenantId: (string) $digest->{NotificationDigestInterface::ATTR_TENANT_ID},
            userId: (string) $digest->{NotificationDigestInterface::ATTR_USER_ID},
            categorySlug: (string) $digest->{NotificationDigestInterface::ATTR_CATEGORY_SLUG},
            channel: $channel,
            state: $state,
            scheduledFor: $digest->{NotificationDigestInterface::ATTR_SCHEDULED_FOR},
            deliveredAt: $digest->{NotificationDigestInterface::ATTR_DELIVERED_AT},
            notificationIds: (array) ($digest->{NotificationDigestInterface::ATTR_NOTIFICATION_IDS} ?? []),
        );
    }
}
