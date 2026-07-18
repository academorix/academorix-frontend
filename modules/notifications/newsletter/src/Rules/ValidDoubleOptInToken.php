<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the value must look like a valid double-opt-in
 * token (base64url-encoded, ≥ 43 chars ≡ 32-byte HMAC).
 *
 * Structural check only — the actual signature verification happens
 * inside {@see \Academorix\Newsletter\Services\DefaultNewsletterService}
 * once the token payload is looked up against the row.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class ValidDoubleOptInToken implements ValidationRule
{
    /**
     * Run the check.
     *
     * @param  Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value)) {
            $fail((string) __('newsletter::validation.valid_double_opt_in_token', ['attribute' => $attribute]));

            return;
        }

        // Base64URL charset: A-Z a-z 0-9 - _ =, minimum length for a
        // 32-byte HMAC in base64 is 43 chars (44 with padding).
        if (! \preg_match('/^[A-Za-z0-9\-_=]{40,}$/', $value)) {
            $fail((string) __('newsletter::validation.valid_double_opt_in_token', ['attribute' => $attribute]));
        }
    }
}
