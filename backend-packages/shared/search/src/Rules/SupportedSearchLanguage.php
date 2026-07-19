<?php

declare(strict_types=1);

namespace Academorix\Search\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rule — the language code MUST be in the configured supported list.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SupportedSearchLanguage implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        /** @var list<string> $supported */
        $supported = (array) \config('search.supported_languages', ['en']);

        if (! \is_string($value) || ! \in_array(\strtolower($value), $supported, true)) {
            $fail(\sprintf('The %s must be a supported search language.', $attribute));
        }
    }
}
