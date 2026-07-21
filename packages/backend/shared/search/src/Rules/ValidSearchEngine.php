<?php

declare(strict_types=1);

namespace Stackra\Search\Rules;

use Stackra\Search\Enums\SearchEngine;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rule — the value MUST match a known {@see SearchEngine} case.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class ValidSearchEngine implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || SearchEngine::tryFrom($value) === null) {
            $fail(\sprintf('The %s must be a supported search engine.', $attribute));
        }
    }
}
