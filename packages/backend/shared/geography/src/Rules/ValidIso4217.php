<?php

declare(strict_types=1);

namespace Stackra\Geography\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a three-letter ISO-4217 currency code.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class ValidIso4217 implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || \preg_match('/^[A-Za-z]{3}$/', $value) !== 1) {
            $fail('The :attribute must be a three-letter ISO-4217 currency code.');
        }
    }
}
