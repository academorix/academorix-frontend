<?php

declare(strict_types=1);

namespace Academorix\Notifications\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate an ISO 639-1 locale identifier.
 *
 * Accepts the 2-letter primary language tag optionally followed by
 * a hyphen + 2-letter region subtag (`en`, `en-US`, `fr`, `fr-CA`).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class ValidLocale implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('notifications::validation.valid_locale'));

            return;
        }

        if (\preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $value) !== 1) {
            $fail(__('notifications::validation.valid_locale'));
        }
    }
}
