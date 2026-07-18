<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data\Requests;

use Academorix\Notifications\Enums\NotificationChannel;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/notification-templates`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTemplateRequestData extends Data
{
    /**
     * @param  string               $key                Template key.
     * @param  string               $categorySlug       Owning category slug.
     * @param  NotificationChannel  $channel            Delivery channel.
     * @param  string               $locale             Locale (ISO 639-1).
     * @param  string               $subjectTemplate    Subject line template.
     * @param  string               $bodyRenderedHtml   Pre-rendered HTML body.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $key,

        #[Required, StringType, Max(128)]
        public string $categorySlug,

        #[Required, Enum(NotificationChannel::class)]
        public NotificationChannel $channel,

        #[Required, StringType, Min(2), Max(8)]
        public string $locale,

        #[Required, StringType, Max(500)]
        public string $subjectTemplate,

        #[Required, StringType]
        public string $bodyRenderedHtml,
    ) {
    }
}
