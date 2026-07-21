<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a tenant slug is DNS-safe.
 *
 * Rules:
 *  - 3-63 characters (DNS label limit).
 *  - Lowercase letters, digits, hyphens only.
 *  - MUST start + end with an alphanumeric character.
 *  - No consecutive hyphens.
 *
 * The slug becomes part of `{slug}.{application.central_host}` so it
 * MUST comply with RFC 1035 label syntax.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class DnsSafeSlug implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  string   $attribute  Field name (unused).
     * @param  mixed    $value      Slug candidate.
     * @param  Closure  $fail       Failure callback.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('tenancy::validation.dns_safe_slug'));

            return;
        }

        $length = \strlen($value);
        if ($length < 3 || $length > 63) {
            $fail(__('tenancy::validation.dns_safe_slug'));

            return;
        }

        // RFC 1035 label — leading + trailing alphanumeric, hyphens
        // only in the middle, no consecutive hyphens.
        if (\preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $value) !== 1) {
            $fail(__('tenancy::validation.dns_safe_slug'));

            return;
        }

        if (\str_contains($value, '--')) {
            $fail(__('tenancy::validation.dns_safe_slug'));
        }
    }
}
