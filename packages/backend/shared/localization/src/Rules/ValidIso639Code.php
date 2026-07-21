<?php

declare(strict_types=1);

namespace Stackra\Localization\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a value as an ISO-639-1 (2-letter) or ISO-639-2 (3-letter)
 * language code. Accepts only the code itself — no script or region
 * subtags. Use {@see ValidBcp47Tag} for the full BCP-47 shape.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class ValidIso639Code implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(\__('localization::errors.invalid_iso639_code', ['value' => (string) $value]));

            return;
        }

        if (\preg_match('/^[a-z]{2,3}$/', $value) !== 1) {
            $fail(\__('localization::errors.invalid_iso639_code', ['value' => $value]));
        }
    }
}
