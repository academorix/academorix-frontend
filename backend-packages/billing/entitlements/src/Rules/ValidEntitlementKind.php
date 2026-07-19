<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Rules;

use Academorix\Entitlements\Enums\EntitlementKind;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate the payload kind is one of the four supported cases.
 *
 * Duplicates the guardrail Laravel's `Enum` rule would give — kept as
 * a dedicated rule so error messages stay module-branded and the
 * kind stays check-able in payload shapes that carry a raw string.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class ValidEntitlementKind implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('entitlements::validation.valid_entitlement_kind'));

            return;
        }

        if (EntitlementKind::tryFrom($value) === null) {
            $fail(__('entitlements::validation.valid_entitlement_kind'));
        }
    }
}
