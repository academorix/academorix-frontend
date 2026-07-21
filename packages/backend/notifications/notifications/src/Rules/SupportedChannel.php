<?php

declare(strict_types=1);

namespace Stackra\Notifications\Rules;

use Stackra\Notifications\Enums\NotificationChannel;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a channel key against the enum of supported channels.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class SupportedChannel implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('notifications::validation.supported_channel'));

            return;
        }

        if (NotificationChannel::tryFrom($value) === null) {
            $fail(__('notifications::validation.supported_channel'));
        }
    }
}
