<?php

declare(strict_types=1);

namespace Stackra\Webhook\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that `backoff_strategy` references a strategy the module
 * ships (currently `static` or `retry-after-aware`).
 *
 * The list is duplicated here so the validator does not need the
 * registry booted — schema-only tests keep working. If the module
 * ships a new strategy, extend {@see self::SUPPORTED} in the same
 * commit.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class SupportedBackoffStrategy implements ValidationRule
{
    /**
     * Strategy names the module ships out of the box.
     *
     * @var list<string>
     */
    public const array SUPPORTED = ['static', 'retry-after-aware'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || ! \in_array($value, self::SUPPORTED, true)) {
            $fail(__('webhook::validation.supported_backoff_strategy'));
        }
    }
}
