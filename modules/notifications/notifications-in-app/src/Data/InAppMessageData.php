<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Data;

use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Academorix\Notifications\InApp\Models\InAppMessage;
use Academorix\Notifications\InApp\Models\InAppMessageRead;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see InAppMessage}.
 *
 * Renders the inbox card the bell UI displays. Includes derived
 * `is_read` / `is_dismissed` fields resolved from the caller-scoped
 * sibling {@see InAppMessageRead} row (bound via
 * {@see fromModelForAddressee()}) so a single response carries every
 * signal the frontend renders.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class InAppMessageData extends Data
{
    /**
     * @param  string                    $id            `iam_<ulid>`.
     * @param  string                    $tenantId      Owning tenant.
     * @param  string                    $notificationId Source notification id.
     * @param  string                    $addresseeId   Recipient id.
     * @param  string                    $categorySlug  Category slug (e.g. `billing.invoice_paid`).
     * @param  string                    $priority      Priority tier.
     * @param  string                    $title         Rendered title.
     * @param  \DateTimeInterface        $createdAt     Row creation timestamp.
     * @param  bool                      $isRead        Whether the caller has viewed the message.
     * @param  bool                      $isDismissed   Whether the caller has dismissed the message.
     * @param  string|null               $bodyPreview   Truncated body for the card.
     * @param  string|null               $actionUrl     Deep-link URL for the primary CTA.
     * @param  string|null               $icon          Icon slug.
     * @param  array<string, mixed>|null $payload       Raw source payload for optional details.
     * @param  \DateTimeInterface|null   $deliveredAt   When the transport landed the row.
     * @param  \DateTimeInterface|null   $readAt        When the caller viewed the message.
     * @param  \DateTimeInterface|null   $dismissedAt   When the caller dismissed the message.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $notificationId,
        public string $addresseeId,
        public string $categorySlug,
        public string $priority,
        public string $title,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        public bool $isRead = false,
        public bool $isDismissed = false,
        public ?string $bodyPreview = null,
        public ?string $actionUrl = null,
        public ?string $icon = null,
        public ?array $payload = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deliveredAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $readAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $dismissedAt = null,
    ) {
    }

    /**
     * Build the DTO from an {@see InAppMessage} without a read-state
     * lookup. `is_read` / `is_dismissed` default to `false` — use
     * {@see fromModelForAddressee()} when the caller's state matters.
     */
    public static function fromModel(InAppMessage $message): self
    {
        return new self(
            id: (string) $message->getKey(),
            tenantId: (string) $message->{InAppMessageInterface::ATTR_TENANT_ID},
            notificationId: (string) $message->{InAppMessageInterface::ATTR_NOTIFICATION_ID},
            addresseeId: (string) $message->{InAppMessageInterface::ATTR_ADDRESSEE_ID},
            categorySlug: (string) $message->{InAppMessageInterface::ATTR_CATEGORY_SLUG},
            priority: (string) $message->{InAppMessageInterface::ATTR_PRIORITY},
            title: (string) $message->{InAppMessageInterface::ATTR_TITLE},
            createdAt: $message->{InAppMessageInterface::ATTR_CREATED_AT},
            isRead: false,
            isDismissed: false,
            bodyPreview: self::nullableString($message, InAppMessageInterface::ATTR_BODY_PREVIEW),
            actionUrl: self::nullableString($message, InAppMessageInterface::ATTR_ACTION_URL),
            icon: self::nullableString($message, InAppMessageInterface::ATTR_ICON),
            payload: self::nullableArray($message, InAppMessageInterface::ATTR_PAYLOAD),
            deliveredAt: $message->{InAppMessageInterface::ATTR_DELIVERED_AT},
            readAt: null,
            dismissedAt: null,
        );
    }

    /**
     * Build the DTO with the caller's read-state bound. Preferred
     * factory for the inbox list + show endpoints.
     */
    public static function fromModelForAddressee(
        InAppMessage $message,
        ?InAppMessageRead $read,
    ): self {
        $readAt      = $read?->{InAppMessageReadInterface::ATTR_READ_AT} ?? null;
        $dismissedAt = $read?->{InAppMessageReadInterface::ATTR_DISMISSED_AT} ?? null;

        return new self(
            id: (string) $message->getKey(),
            tenantId: (string) $message->{InAppMessageInterface::ATTR_TENANT_ID},
            notificationId: (string) $message->{InAppMessageInterface::ATTR_NOTIFICATION_ID},
            addresseeId: (string) $message->{InAppMessageInterface::ATTR_ADDRESSEE_ID},
            categorySlug: (string) $message->{InAppMessageInterface::ATTR_CATEGORY_SLUG},
            priority: (string) $message->{InAppMessageInterface::ATTR_PRIORITY},
            title: (string) $message->{InAppMessageInterface::ATTR_TITLE},
            createdAt: $message->{InAppMessageInterface::ATTR_CREATED_AT},
            isRead: $readAt !== null,
            isDismissed: $dismissedAt !== null,
            bodyPreview: self::nullableString($message, InAppMessageInterface::ATTR_BODY_PREVIEW),
            actionUrl: self::nullableString($message, InAppMessageInterface::ATTR_ACTION_URL),
            icon: self::nullableString($message, InAppMessageInterface::ATTR_ICON),
            payload: self::nullableArray($message, InAppMessageInterface::ATTR_PAYLOAD),
            deliveredAt: $message->{InAppMessageInterface::ATTR_DELIVERED_AT},
            readAt: $readAt,
            dismissedAt: $dismissedAt,
        );
    }

    /**
     * Coerce a nullable string attribute; empty strings collapse to
     * null for a clean wire payload.
     */
    private static function nullableString(InAppMessage $message, string $key): ?string
    {
        $value = $message->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Coerce a nullable array attribute; normalises `Collection`
     * casts to plain arrays for JSON serialisation.
     *
     * @return array<string, mixed>|null
     */
    private static function nullableArray(InAppMessage $message, string $key): ?array
    {
        $raw = $message->{$key} ?? null;

        if ($raw === null) {
            return null;
        }

        if (\is_array($raw)) {
            /** @var array<string, mixed> $raw */
            return $raw;
        }

        if (\is_object($raw) && \method_exists($raw, 'toArray')) {
            /** @var array<string, mixed> $result */
            $result = $raw->toArray();

            return $result;
        }

        return null;
    }
}
