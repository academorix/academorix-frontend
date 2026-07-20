<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data;

use Academorix\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Academorix\Notifications\Enums\DigestMode;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Notifications\Models\NotificationPreference;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see NotificationPreference}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationPreferenceData extends Data
{
    /**
     * @param  string               $id                    `pref_<ulid>`.
     * @param  string               $tenantId              Owning tenant.
     * @param  string               $userId                Owning user.
     * @param  string               $categorySlug          Category slug.
     * @param  NotificationChannel  $channel               Channel key.
     * @param  bool                 $enabled               Whether delivery is enabled.
     * @param  DigestMode           $digestMode            Digest mode.
     * @param  string|null          $quietHoursStart       Quiet-hours window start (HH:MM).
     * @param  string|null          $quietHoursEnd         Quiet-hours window end (HH:MM).
     * @param  string|null          $quietHoursTimezone    Quiet-hours timezone (IANA).
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $userId,
        public string $categorySlug,
        public NotificationChannel $channel,
        public bool $enabled,
        public DigestMode $digestMode,
        public ?string $quietHoursStart,
        public ?string $quietHoursEnd,
        public ?string $quietHoursTimezone,
    ) {
    }

    /**
     * Build the DTO from a NotificationPreference model.
     */
    public static function fromModel(NotificationPreference $preference): self
    {
        $channelValue = $preference->{NotificationPreferenceInterface::ATTR_CHANNEL};
        $channel = $channelValue instanceof NotificationChannel
            ? $channelValue
            : (NotificationChannel::tryFrom((string) $channelValue) ?? NotificationChannel::InApp);

        $digestValue = $preference->{NotificationPreferenceInterface::ATTR_DIGEST_MODE};
        $digestMode = $digestValue instanceof DigestMode
            ? $digestValue
            : (DigestMode::tryFrom((string) $digestValue) ?? DigestMode::Immediate);

        return new self(
            id: (string) $preference->getKey(),
            tenantId: (string) $preference->{NotificationPreferenceInterface::ATTR_TENANT_ID},
            userId: (string) $preference->{NotificationPreferenceInterface::ATTR_USER_ID},
            categorySlug: (string) $preference->{NotificationPreferenceInterface::ATTR_CATEGORY_SLUG},
            channel: $channel,
            enabled: (bool) $preference->{NotificationPreferenceInterface::ATTR_ENABLED},
            digestMode: $digestMode,
            quietHoursStart: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_START},
            quietHoursEnd: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_END},
            quietHoursTimezone: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_TIMEZONE},
        );
    }
}
