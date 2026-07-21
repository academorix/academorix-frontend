<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Rules;

use Stackra\Notifications\Mail\Enums\MailProvider;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Invokable validation rule — the supplied value must be one of the
 * supported mail providers ({@see MailProvider} backing values).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/module.json §contributes.rules
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class SupportedMailProvider implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(\sprintf(
                'The %s field must be a supported mail provider.',
                $attribute,
            ));

            return;
        }

        $allowed = \array_map(
            static fn (MailProvider $provider): string => $provider->value,
            MailProvider::cases(),
        );

        if (! \in_array($value, $allowed, true)) {
            $fail(\sprintf(
                'The %s field must be one of: %s.',
                $attribute,
                \implode(', ', $allowed),
            ));
        }
    }
}
