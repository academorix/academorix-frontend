<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/translations` — tenant admin
 * creates a hand-authored translation override.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTranslationRequestData extends Data
{
    /**
     * @param  string       $languageId  Platform-language id (`lng_<ulid>`).
     * @param  string       $namespace   Namespace bucket (default `*`).
     * @param  string       $group       Group name (e.g. `messages`, `validation`).
     * @param  string       $key         Translation key.
     * @param  string       $value       The translated string.
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $languageId,

        #[Required, StringType, Max(64)]
        public string $namespace,

        #[Required, StringType, Max(64)]
        public string $group,

        #[Required, StringType, Max(191)]
        public string $key,

        #[Required, StringType]
        public string $value,
    ) {
    }
}
