<?php

declare(strict_types=1);

namespace Academorix\Forms\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Result of {@see \Academorix\Forms\Services\FormValidator::validate}.
 *
 * `passed` is the top-line flag callers branch on. When false,
 * `errors` maps each failed field key to a list of Laravel-style
 * error messages. `skipped` lists fields whose `visible_when`
 * expression evaluated falsey — the client did not have to supply
 * them and they are not counted as missing.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FormValidationResultData extends Data
{
    /**
     * @param  bool                             $passed   Top-line flag.
     * @param  array<string, list<string>>      $errors   Field key -> list of error messages.
     * @param  list<string>                     $skipped  Field keys that were legitimately absent (visible_when falsey).
     */
    public function __construct(
        public bool $passed,
        public array $errors = [],
        public array $skipped = [],
    ) {
    }
}
