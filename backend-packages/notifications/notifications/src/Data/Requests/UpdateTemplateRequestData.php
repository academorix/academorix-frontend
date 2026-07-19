<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/v1/tenant/notification-templates/{template}`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTemplateRequestData extends Data
{
    /**
     * @param  string|null  $subjectTemplate    Subject line template.
     * @param  string|null  $bodyRenderedHtml   Pre-rendered HTML body.
     */
    public function __construct(
        #[StringType, Max(500)]
        public ?string $subjectTemplate = null,

        #[StringType]
        public ?string $bodyRenderedHtml = null,
    ) {
    }
}
