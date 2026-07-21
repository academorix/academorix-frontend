<?php

declare(strict_types=1);

namespace Stackra\Geography\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a two-letter ISO-639-1 language code.
 *
 * Accepts both upper and lower case; the observer normalises to
 * lowercase on save.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class ValidIso6391 implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || \preg_match('/^[A-Za-z]{2}$/', $value) !== 1) {
            $fail('The :attribute must be a two-letter ISO-639-1 language code.');
        }
    }
}
