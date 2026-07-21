<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Reject slugs on the platform's reserved-word list.
 *
 * The list lives in `config/tenancy.php` under
 * `tenants.hosts.reserved_slugs`. Includes DNS + operational
 * reserved names (`www`, `api`, `admin`, `mail`, `blog`,
 * `platform`, `app`, `static`, `cdn`, `help`, `support`, `status`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class ReservedSlug implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            return;
        }

        /** @var list<string> $reserved */
        $reserved = (array) \config('tenancy.hosts.reserved_slugs', []);
        $reserved = \array_map('strtolower', $reserved);

        if (\in_array(\strtolower($value), $reserved, true)) {
            $fail(__('tenancy::validation.reserved_slug'));
        }
    }
}
