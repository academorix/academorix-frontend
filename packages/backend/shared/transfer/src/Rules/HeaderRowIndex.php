<?php

declare(strict_types=1);

namespace Stackra\Transfer\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the header row index must be a positive integer
 * strictly less than 100 (spreadsheet headers should never live
 * below row 100 in practice; anything above signals a mapping
 * mistake).
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class HeaderRowIndex implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_int($value) || $value < 1 || $value >= 100) {
            $fail(\sprintf('The %s must be an integer between 1 and 99.', $attribute));
        }
    }
}
