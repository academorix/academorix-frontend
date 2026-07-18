<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/transfer/imports`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateImportRequestData extends Data
{
    /**
     * @param  string             $entity            Entity registry key.
     * @param  string             $mode              Import mode (`append` / `upsert` / `replace` / `delete`).
     * @param  string|null        $mappingProfileId  Optional saved profile.
     * @param  list<string>|null  $notifyChannels    Caller override for notification channels.
     * @param  string|null        $format            Optional format override.
     */
    public function __construct(
        #[Required, StringType, Max(128)]
        public string $entity,

        #[Required, In(['append', 'upsert', 'replace', 'delete'])]
        public string $mode,

        #[StringType, Max(64)]
        public ?string $mappingProfileId = null,

        public ?array $notifyChannels = null,

        #[StringType, In(['xlsx', 'csv', 'xls'])]
        public ?string $format = null,
    ) {
    }
}
