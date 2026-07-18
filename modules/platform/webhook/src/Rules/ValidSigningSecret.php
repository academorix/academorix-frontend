<?php

declare(strict_types=1);

namespace Academorix\Webhook\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a signing secret — hex-encoded string of at least 32
 * bytes (64 hex chars).
 *
 * Applied on the rare code path where a caller supplies their own
 * secret; normally the observer generates one via `random_bytes(32)`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class ValidSigningSecret implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('webhook::validation.valid_signing_secret'));

            return;
        }

        if (\preg_match('/^[0-9a-fA-F]{64,}$/', $value) !== 1) {
            $fail(__('webhook::validation.valid_signing_secret'));
        }
    }
}
