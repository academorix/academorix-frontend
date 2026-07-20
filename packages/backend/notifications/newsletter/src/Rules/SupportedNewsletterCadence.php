<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Rules;

use Academorix\Newsletter\Enums\NewsletterCadence;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the value must match one of the
 * {@see NewsletterCadence} backing values.
 *
 * Kept as an explicit rule (rather than the built-in `Rule::enum`)
 * because the error message needs to be i18n-friendly and the enum
 * check is used in a handful of Data classes.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class SupportedNewsletterCadence implements ValidationRule
{
    /**
     * Run the check.
     *
     * @param  Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) && ! ($value instanceof NewsletterCadence)) {
            $fail((string) __('newsletter::validation.supported_newsletter_cadence', ['attribute' => $attribute]));

            return;
        }

        $raw = $value instanceof NewsletterCadence ? $value->value : $value;
        if (NewsletterCadence::tryFrom($raw) === null) {
            $fail((string) __('newsletter::validation.supported_newsletter_cadence', ['attribute' => $attribute]));
        }
    }
}
