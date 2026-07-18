<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data\Requests;

use Academorix\Notifications\Enums\DigestMode;
use Academorix\Notifications\Enums\NotificationChannel;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/v1/tenant/notification-preferences`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdatePreferencesRequestData extends Data
{
    /**
     * @param  string               $categorySlug         Category slug being updated.
     * @param  NotificationChannel  $channel              Channel key being updated.
     * @param  bool                 $enabled              New enabled state.
     * @param  DigestMode|null      $digestMode           Digest mode override.
     * @param  string|null          $quietHoursStart      Quiet-hours window start (HH:MM).
     * @param  string|null          $quietHoursEnd        Quiet-hours window end (HH:MM).
     * @param  string|null          $quietHoursTimezone   Quiet-hours timezone (IANA).
     */
    public function __construct(
        #[Required, StringType, Max(128)]
        public string $categorySlug,

        #[Required, Enum(NotificationChannel::class)]
        public NotificationChannel $channel,

        public bool $enabled,

        #[Enum(DigestMode::class)]
        public ?DigestMode $digestMode = null,

        #[StringType, Max(8)]
        public ?string $quietHoursStart = null,

        #[StringType, Max(8)]
        public ?string $quietHoursEnd = null,

        #[StringType, Max(64)]
        public ?string $quietHoursTimezone = null,
    ) {
    }
}
