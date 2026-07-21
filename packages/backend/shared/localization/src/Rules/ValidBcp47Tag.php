<?php

declare(strict_types=1);

namespace Stackra\Localization\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate a value against the BCP-47 (RFC 5646) grammar.
 *
 * Accepts:
 *  - `en`, `fr`, `zh` (language subtag only)
 *  - `zh-Hans`, `zh-Hant` (language + script)
 *  - `fr-CA`, `en-GB`, `pt-BR` (language + region)
 *  - `zh-Hans-CN` (language + script + region)
 *  - `en-US-x-custom` (private-use extension)
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class ValidBcp47Tag implements ValidationRule
{
    /**
     * Reasonably loose regex that captures the well-formed cases the
     * platform cares about. Fully-compliant BCP-47 parsers accept
     * extensions we do not use (`x-`, `u-`, `t-`) — those pass
     * through the trailing `(?:-.+)?` group.
     */
    private const string PATTERN = '/^(?<language>[a-z]{2,3})(?:-(?<script>[A-Z][a-z]{3}))?(?:-(?<region>[A-Z]{2}|[0-9]{3}))?(?:-.+)?$/';

    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(\__('localization::errors.invalid_bcp47_tag', ['value' => (string) $value]));

            return;
        }

        if (\preg_match(self::PATTERN, $value) !== 1) {
            $fail(\__('localization::errors.invalid_bcp47_tag', ['value' => $value]));
        }
    }
}
