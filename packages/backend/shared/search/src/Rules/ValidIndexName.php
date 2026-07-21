<?php

declare(strict_types=1);

namespace Stackra\Search\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rule — an index name is `[a-z0-9_]{1,191}` (lowercase alphanumeric
 * + underscore).
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class ValidIndexName implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '' || \strlen($value) > 191) {
            $fail(\sprintf('The %s must be between 1 and 191 characters.', $attribute));

            return;
        }

        if (\preg_match('/^[a-z0-9_]+$/', $value) !== 1) {
            $fail(\sprintf('The %s must only contain lowercase letters, digits, and underscores.', $attribute));
        }
    }
}
