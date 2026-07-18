<?php

declare(strict_types=1);

namespace Academorix\Transfer\Rules;

use Academorix\Transfer\Enums\ImportFormat;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the value must be one of the supported
 * `ImportFormat` backing values.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class SupportedImportFormat implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || ImportFormat::tryFrom($value) === null) {
            $fail(\sprintf('The %s must be a supported import format.', $attribute));
        }
    }
}
