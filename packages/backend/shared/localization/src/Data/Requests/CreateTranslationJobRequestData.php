<?php

declare(strict_types=1);

namespace Stackra\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/translation-jobs` — dispatch a
 * bulk translation job.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTranslationJobRequestData extends Data
{
    /**
     * @param  string       $kind             Job kind: `namespace` | `backfill` | `content`.
     * @param  string       $sourceLocale    BCP-47 source tag.
     * @param  string       $targetLocale    BCP-47 target tag.
     * @param  string|null  $driver           Optional driver override.
     * @param  string|null  $namespaceFilter Optional namespace filter (`kind=namespace`).
     * @param  string|null  $groupFilter     Optional group filter (`kind=namespace`).
     */
    public function __construct(
        #[Required, StringType, In(['namespace', 'backfill', 'content'])]
        public string $kind,

        #[Required, StringType, Max(32)]
        public string $sourceLocale,

        #[Required, StringType, Max(32)]
        public string $targetLocale,

        #[StringType, Max(32)]
        public ?string $driver = null,

        #[StringType, Max(64)]
        public ?string $namespaceFilter = null,

        #[StringType, Max(64)]
        public ?string $groupFilter = null,
    ) {
    }
}
