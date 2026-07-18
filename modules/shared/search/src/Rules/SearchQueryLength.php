<?php

declare(strict_types=1);

namespace Academorix\Search\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rule — the search query MUST not exceed `search.query.max_length`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueryLength implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $max = (int) \config('search.query.max_length', 512);

        if (! \is_string($value) || \strlen($value) > $max) {
            $fail(\sprintf('The %s must be at most %d characters.', $attribute, $max));
        }
    }
}
