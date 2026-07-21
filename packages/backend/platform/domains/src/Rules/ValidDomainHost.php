<?php

declare(strict_types=1);

namespace Stackra\Domains\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a DNS hostname against RFC 1035 syntax.
 *
 * Rules:
 *  - 1-253 characters total.
 *  - Each label 1-63 characters.
 *  - Labels start + end alphanumeric; hyphens in middle only.
 *  - Rejects raw IPv4 + IPv6 addresses.
 *  - Rejects reserved TLDs (`localhost`, `local`, `example`, `test`,
 *    `invalid`) — customers cannot own these.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class ValidDomainHost implements ValidationRule
{
    /**
     * Reserved TLDs a customer cannot own.
     *
     * @var list<string>
     */
    private const array RESERVED_TLDS = ['localhost', 'local', 'example', 'test', 'invalid'];

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('domains::validation.valid_domain_host'));

            return;
        }

        $host = \strtolower(\trim($value));

        // Reject IP addresses — they cannot be tenant custom domains.
        if (\filter_var($host, \FILTER_VALIDATE_IP) !== false) {
            $fail(__('domains::validation.valid_domain_host'));

            return;
        }

        // Overall length.
        if (\strlen($host) > 253) {
            $fail(__('domains::validation.valid_domain_host'));

            return;
        }

        // Reserved TLD check — the label after the last dot.
        $lastDot = \strrpos($host, '.');
        $tld     = $lastDot === false ? $host : \substr($host, $lastDot + 1);
        if (\in_array($tld, self::RESERVED_TLDS, true)) {
            $fail(__('domains::validation.valid_domain_host'));

            return;
        }

        // Per-label validation — 1-63 chars, alphanumeric start/end,
        // hyphens in middle only, no consecutive hyphens.
        foreach (\explode('.', $host) as $label) {
            $len = \strlen($label);
            if ($len < 1 || $len > 63) {
                $fail(__('domains::validation.valid_domain_host'));

                return;
            }

            if (\preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $label) !== 1) {
                $fail(__('domains::validation.valid_domain_host'));

                return;
            }

            if (\str_contains($label, '--')) {
                $fail(__('domains::validation.valid_domain_host'));

                return;
            }
        }
    }
}
