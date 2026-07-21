<?php

declare(strict_types=1);

namespace Stackra\Branding\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a `#RRGGBB` hex-color string.
 *
 * Accepts only the 7-char uppercase-or-lowercase form; rejects the
 * 3-char shorthand + rgb()/hsl() functional forms + named CSS colors.
 * Keeps the palette consistent + easy to serialise.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class ValidHexColor implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('branding::validation.valid_hex_color'));

            return;
        }

        if (\preg_match('/^#[0-9a-fA-F]{6}$/', $value) !== 1) {
            $fail(__('branding::validation.valid_hex_color'));
        }
    }
}
