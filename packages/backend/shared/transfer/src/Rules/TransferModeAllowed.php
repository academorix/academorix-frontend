<?php

declare(strict_types=1);

namespace Stackra\Transfer\Rules;

use Stackra\Transfer\Enums\ImportMode;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule — the value must be a valid `ImportMode`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferModeAllowed implements ValidationRule
{
    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || ImportMode::tryFrom($value) === null) {
            $fail(\sprintf('The %s must be a valid transfer mode.', $attribute));
        }
    }
}
