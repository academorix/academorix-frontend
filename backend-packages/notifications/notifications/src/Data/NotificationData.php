<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data;

use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\Enums\NotificationPriority;
use Academorix\Notifications\Enums\NotificationStatus;
use Academorix\Notifications\Models\Notification;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Notification}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationData extends Data
{
    /**
     * @param  string                    $id             `not_<ulid>`.
     * @param  string                    $tenantId       Owning tenant.
     * @param  string|null               $applicationId  Owning application.
     * @param  string                    $categorySlug   Category slug.
     * @param  string                    $templateKey    Template key at dispatch.
     * @param  NotificationPriority      $priority       Priority tier.
     * @param  NotificationStatus        $state          Lifecycle state.
     * @param  string                    $addresseeType  `user` or `anonymous`.
     * @param  string|null               $addresseeId    Addressee id.
     * @param  string                    $addresseeName  Denormalised display name.
     * @param  \DateTimeInterface        $createdAt      Row creation.
     * @param  \DateTimeInterface        $updatedAt      Last mutation.
     * @param  \DateTimeInterface|null   $seenAt         When marked seen.
     * @param  \DateTimeInterface|null   $archivedAt     When archived.
     * @param  string|null               $subject        Notification subject.
     * @param  array<string, mixed>|null $payload        Template variables.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public ?string $applicationId,
        public string $categorySlug,
        public string $templateKey,
        public NotificationPriority $priority,
        public NotificationStatus $state,
        public string $addresseeType,
        public ?string $addresseeId,
        public string $addresseeName,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $seenAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $archivedAt = null,
        public ?string $subject = null,
        public ?array $payload = null,
    ) {
    }

    /**
     * Build the DTO from a Notification model.
     */
    public static function fromModel(Notification $notification): self
    {
        $priorityValue = $notification->{NotificationInterface::ATTR_PRIORITY};
        $priority = $priorityValue instanceof NotificationPriority
            ? $priorityValue
            : (NotificationPriority::tryFrom((string) $priorityValue) ?? NotificationPriority::Product);

        $stateValue = $notification->{NotificationInterface::ATTR_STATE};
        $state = $stateValue instanceof NotificationStatus
            ? $stateValue
            : (NotificationStatus::tryFrom((string) $stateValue) ?? NotificationStatus::Queued);

        return new self(
            id: (string) $notification->getKey(),
            tenantId: (string) $notification->{NotificationInterface::ATTR_TENANT_ID},
            applicationId: $notification->{NotificationInterface::ATTR_APPLICATION_ID},
            categorySlug: (string) $notification->{NotificationInterface::ATTR_CATEGORY_SLUG},
            templateKey: (string) $notification->{NotificationInterface::ATTR_TEMPLATE_KEY},
            priority: $priority,
            state: $state,
            addresseeType: (string) $notification->{NotificationInterface::ATTR_ADDRESSEE_TYPE},
            addresseeId: $notification->{NotificationInterface::ATTR_ADDRESSEE_ID},
            addresseeName: (string) $notification->{NotificationInterface::ATTR_ADDRESSEE_NAME},
            createdAt: $notification->{NotificationInterface::ATTR_CREATED_AT},
            updatedAt: $notification->{NotificationInterface::ATTR_UPDATED_AT},
            seenAt: $notification->{NotificationInterface::ATTR_SEEN_AT},
            archivedAt: $notification->{NotificationInterface::ATTR_ARCHIVED_AT},
            subject: $notification->{NotificationInterface::ATTR_SUBJECT},
            payload: $notification->{NotificationInterface::ATTR_PAYLOAD},
        );
    }
}
