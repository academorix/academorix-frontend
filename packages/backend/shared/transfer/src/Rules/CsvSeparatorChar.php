<?php

declare(strict_types=1);

namespace Stackra\Transfer\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the separator must be a single character.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class CsvSeparatorChar implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || \strlen($value) !== 1) {
            $fail(\sprintf('The %s must be a single character.', $attribute));
        }
    }
}
