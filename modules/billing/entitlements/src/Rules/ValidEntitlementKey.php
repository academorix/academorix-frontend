<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate an entitlement key is a well-formed dot-separated
 * identifier.
 *
 * Shape: `[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*` — lowercase words
 * separated by dots. Examples: `webhook.subscriptions.max`,
 * `ai.tokens.month`, `storage.bytes.consumed`.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class ValidEntitlementKey implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('entitlements::validation.valid_entitlement_key'));

            return;
        }

        if (\preg_match('/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/', $value) !== 1) {
            $fail(__('entitlements::validation.valid_entitlement_key'));
        }
    }
}
