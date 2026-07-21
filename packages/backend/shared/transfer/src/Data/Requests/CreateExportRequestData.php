<?php

declare(strict_types=1);

namespace Stackra\Transfer\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/transfer/exports`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateExportRequestData extends Data
{
    /**
     * @param  string                     $entity          Entity registry key.
     * @param  string                     $format          Export format.
     * @param  array<string, mixed>|null  $filters         Optional spatie/laravel-query-builder grammar.
     * @param  list<string>|null          $include         Optional relation includes.
     * @param  string|null                $sort            Optional sort expression.
     * @param  list<string>|null          $columns         Optional column allow-list.
     * @param  list<string>|null          $notifyChannels  Caller override.
     */
    public function __construct(
        #[Required, StringType, Max(128)]
        public string $entity,

        #[Required, In(['xlsx', 'csv', 'pdf', 'json'])]
        public string $format,

        public ?array $filters = null,

        public ?array $include = null,

        #[StringType, Max(255)]
        public ?string $sort = null,

        public ?array $columns = null,

        public ?array $notifyChannels = null,
    ) {
    }
}
