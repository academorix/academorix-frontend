<?php

declare(strict_types=1);

namespace Academorix\Notifications\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a template key.
 *
 * Rules:
 *  - Dot-separated: `<module>.<event>`.
 *  - Each segment: lowercase letters, digits, underscores.
 *  - Length: 3-191 characters overall.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class TemplateKeyFormat implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('notifications::validation.template_key_format'));

            return;
        }

        $key = \strtolower(\trim($value));
        $len = \strlen($key);

        if ($len < 3 || $len > 191) {
            $fail(__('notifications::validation.template_key_format'));

            return;
        }

        if (! \str_contains($key, '.')) {
            $fail(__('notifications::validation.template_key_format'));

            return;
        }

        foreach (\explode('.', $key) as $segment) {
            if (\preg_match('/^[a-z0-9_]+$/', $segment) !== 1) {
                $fail(__('notifications::validation.template_key_format'));

                return;
            }
        }
    }
}
