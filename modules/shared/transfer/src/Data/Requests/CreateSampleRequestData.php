<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/transfer/samples`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateSampleRequestData extends Data
{
    /**
     * @param  string    $entity  Entity registry key.
     * @param  int|null  $count   Number of rows to fabricate.
     */
    public function __construct(
        #[Required, StringType, Max(128)]
        public string $entity,

        #[Between(1, 500)]
        public ?int $count = null,
    ) {
    }
}
