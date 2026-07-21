<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\After;
use Spatie\LaravelData\Attributes\Validation\Date;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/newsletters/{newsletter}/issues/{issue}/schedule`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ScheduleNewsletterIssueRequestData extends Data
{
    public function __construct(
        #[Required, Date, After('now')]
        public string $scheduledAt,

        #[Required, StringType, Max(64)]
        public string $audienceId,
    ) {
    }
}
