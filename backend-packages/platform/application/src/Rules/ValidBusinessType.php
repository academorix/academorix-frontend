<?php

declare(strict_types=1);

namespace Academorix\Application\Rules;

use Academorix\Application\Contracts\Data\BusinessTypeInterface;
use Academorix\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Academorix\Application\Enums\BusinessTypeEnum;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the value is a valid `BusinessType` slug.
 *
 * Passes when the slug either:
 *   1. Matches a shipped `BusinessTypeEnum` case value (system row).
 *   2. Resolves to a tenant-custom row for the caller's active tenant
 *      (when a tenant id is bound to the resolver).
 *
 * Refuses `BusinessTypeEnum::Custom`'s backing value (`custom`) —
 * `Custom` is a code-level bucket, never a real slug.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class ValidBusinessType implements ValidationRule
{
    /**
     * @param  BusinessTypeRepositoryInterface  $businessTypes  Injected — used for tenant-custom lookup.
     * @param  string|null  $tenantId  Optional tenant scope; when set, tenant customs are also valid.
     */
    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
        private readonly ?string $tenantId = null,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(':attribute must be a non-empty string.');
            return;
        }

        // Reject the reserved `custom` slug — it's a code bucket, never a real row.
        if ($value === BusinessTypeEnum::Custom->value) {
            $fail(':attribute cannot be the reserved "custom" bucket.');
            return;
        }

        // Enum case — system row check.
        if (BusinessTypeEnum::tryFrom($value) !== null) {
            return;
        }

        // Tenant custom lookup.
        if ($this->tenantId !== null) {
            $row = $this->businessTypes->findBySlug($value, $this->tenantId);
            if ($row !== null && $row->{BusinessTypeInterface::ATTR_IS_VISIBLE} === true) {
                return;
            }
        }

        $fail(':attribute is not a recognised BusinessType.');
    }
}
