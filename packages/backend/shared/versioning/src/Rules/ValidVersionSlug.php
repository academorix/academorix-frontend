<?php

declare(strict_types=1);

namespace Stackra\Versioning\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a value is a well-formed version slug.
 *
 * Accepts SemVer-style slugs (`v1`, `v1.2`, `v1.2.3`) and CalVer-style
 * slugs (`2024`, `2024-10`, `2024-10-15`). Rejects reserved slugs
 * (`default`, `current`, `latest`).
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ValidVersionSlug implements ValidationRule
{
    /**
     * Reserved slugs that must never be persisted.
     *
     * @var list<string>
     */
    private const RESERVED = ['default', 'current', 'latest'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail((string) \__('versioning::validation.valid_version_slug'));

            return;
        }

        if (\in_array($value, self::RESERVED, true)) {
            $fail((string) \__('versioning::validation.valid_version_slug'));

            return;
        }

        // SemVer shape: v1, v1.2, v1.2.3
        if (\preg_match('/^v\d+(\.\d+(\.\d+)?)?$/', $value) === 1) {
            return;
        }

        // CalVer shape: 2024, 2024-10, 2024-10-15
        if (\preg_match('/^\d{4}(-\d{2}(-\d{2})?)?$/', $value) === 1) {
            return;
        }

        $fail((string) \__('versioning::validation.valid_version_slug'));
    }
}
