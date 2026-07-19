<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/newsletters/{newsletter}/campaigns/{campaign}/cancel`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CancelCampaignRequestData extends Data
{
    public function __construct(
        #[StringType, Max(500)]
        public string $reason = 'cancelled_by_admin',
    ) {
    }
}
