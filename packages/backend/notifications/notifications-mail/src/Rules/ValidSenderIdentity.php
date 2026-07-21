<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Invokable validation rule — the supplied email address must be a
 * verified sender identity on the currently-selected mail provider.
 *
 * The current implementation performs a syntactic + domain
 * plausibility check; the provider-side "is this address verified"
 * network call lands when the provider SDKs are wired. Failing
 * this rule surfaces error code
 * `NOTIFICATIONS_MAIL_INVALID_SENDER_IDENTITY` (HTTP 422).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/module.json §contributes.rules
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class ValidSenderIdentity implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(\__('notifications-mail::errors.invalid_sender_identity'));

            return;
        }

        if (! \filter_var($value, \FILTER_VALIDATE_EMAIL)) {
            $fail(\__('notifications-mail::errors.invalid_sender_identity'));

            return;
        }

        $atPos = \strrpos($value, '@');
        $domain = $atPos === false ? '' : \substr($value, $atPos + 1);

        if ($domain === '' || ! \str_contains($domain, '.')) {
            $fail(\__('notifications-mail::errors.invalid_sender_identity'));

            return;
        }
    }
}
