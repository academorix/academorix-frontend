<?php

declare(strict_types=1);

namespace Stackra\Notifications\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/notification-templates/{template}/test`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TestTemplateRequestData extends Data
{
    /**
     * @param  string       $recipientEmail  Test recipient email address.
     * @param  string|null  $locale          Locale override for the render.
     */
    public function __construct(
        #[Required, Email, Max(320)]
        public string $recipientEmail,

        #[StringType, Max(8)]
        public ?string $locale = null,
    ) {
    }
}
