<?php

declare(strict_types=1);

namespace Stackra\Notifications\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a recipient block for shape compliance.
 *
 * The dispatch call carries a recipient payload with an `id`,
 * `type`, `email`, `phone`, `name`, `locale`, `timezone`. This rule
 * enforces the minimum required keys are present.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class RecipientShape implements ValidationRule
{
    /**
     * Required keys on the recipient block.
     *
     * @var list<string>
     */
    private const array REQUIRED_KEYS = ['type', 'name', 'locale', 'timezone'];

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_array($value)) {
            $fail(__('notifications::validation.recipient_shape'));

            return;
        }

        foreach (self::REQUIRED_KEYS as $key) {
            if (! \array_key_exists($key, $value) || $value[$key] === null || $value[$key] === '') {
                $fail(__('notifications::validation.recipient_shape'));

                return;
            }
        }

        // For a `user` recipient, either `email` or `phone` must be
        // present so the dispatch pipeline has a delivery target.
        if ($value['type'] === 'user') {
            $hasEmail = isset($value['email']) && $value['email'] !== '';
            $hasPhone = isset($value['phone']) && $value['phone'] !== '';

            if (! $hasEmail && ! $hasPhone) {
                $fail(__('notifications::validation.recipient_shape'));
            }
        }
    }
}
