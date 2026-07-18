<?php

declare(strict_types=1);

namespace Academorix\Search\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/search/synonyms`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateSynonymRequestData extends Data
{
    /**
     * @param  string        $language       ISO-639-1 language tag.
     * @param  string        $kind           One of `equivalent`, `one_way`, `expansion`.
     * @param  list<string>  $terms          Terms — required for equivalent / expansion.
     * @param  string|null   $oneWaySource   Source term for kind = `one_way`.
     * @param  list<string>  $oneWayTargets  Target terms for kind = `one_way`.
     * @param  string|null   $description    Optional operator note.
     */
    public function __construct(
        #[Required, StringType, Max(8)]
        public string $language,

        #[Required, In(['equivalent', 'one_way', 'expansion'])]
        public string $kind,

        public array $terms = [],

        #[StringType, Max(191)]
        public ?string $oneWaySource = null,

        public array $oneWayTargets = [],

        #[StringType, Max(500)]
        public ?string $description = null,
    ) {
    }
}
