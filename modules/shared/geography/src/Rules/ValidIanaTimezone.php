<?php

declare(strict_types=1);

namespace Academorix\Geography\Rules;

use Closure;
use DateTimeZone;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate an IANA timezone name.
 *
 * Uses PHP's `timezone_identifiers_list()` — the definitive
 * runtime list — rather than a bespoke pattern.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class ValidIanaTimezone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail('The :attribute must be a non-empty IANA timezone name.');

            return;
        }

        if (! \in_array($value, DateTimeZone::listIdentifiers(), true)) {
            $fail('The :attribute must be a valid IANA timezone name.');
        }
    }
}
