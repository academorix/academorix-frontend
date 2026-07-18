<?php

declare(strict_types=1);

namespace Academorix\Geography\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a two-letter ISO-3166 alpha-2 country code.
 *
 * Accepts both upper and lower case; the observer normalises to
 * uppercase on save.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class ValidIso3166Alpha2 implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || \preg_match('/^[A-Za-z]{2}$/', $value) !== 1) {
            $fail('The :attribute must be a two-letter ISO-3166 alpha-2 code.');
        }
    }
}
