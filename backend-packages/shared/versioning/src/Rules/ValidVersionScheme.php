<?php

declare(strict_types=1);

namespace Academorix\Versioning\Rules;

use Academorix\Versioning\Enums\VersionScheme;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a value is a supported version scheme identifier.
 *
 * Delegates to the {@see VersionScheme} enum — a scheme is valid iff
 * `VersionScheme::tryFrom($value)` returns a case.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ValidVersionScheme implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail((string) \__('versioning::validation.valid_version_scheme'));

            return;
        }

        if (VersionScheme::tryFrom($value) === null) {
            $fail((string) \__('versioning::validation.valid_version_scheme'));
        }
    }
}
