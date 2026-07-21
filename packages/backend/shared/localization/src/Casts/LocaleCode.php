<?php

declare(strict_types=1);

namespace Stackra\Localization\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Attribute cast that normalises a BCP-47 tag to the canonical form
 * on write and passes it through unchanged on read.
 *
 * Canonicalisation rules (per RFC 5646 §4.5):
 *  - language subtag: lowercase (`EN` → `en`)
 *  - script subtag:   title case (`hans` → `Hans`, `hant` → `Hant`)
 *  - region subtag:   uppercase (`ca` → `CA`, `gb` → `GB`)
 *
 * @implements CastsAttributes<string|null, string|null>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class LocaleCode implements CastsAttributes
{
    /**
     * {@inheritDoc}
     *
     * Read-side is a pass-through — the stored value is already in
     * canonical form because {@see set()} normalised it on write.
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return (string) $value;
    }

    /**
     * {@inheritDoc}
     *
     * Normalise the passed BCP-47 tag before persisting. Non-string
     * values pass through null so a caller assigning `null` clears
     * the column cleanly.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $raw = (string) $value;

        // Split on `-` — RFC 5646 delimiter. Every subtag is folded
        // according to the position it lands in.
        $parts = \explode('-', $raw);
        $normalised = [];

        foreach ($parts as $index => $part) {
            $part = \trim($part);
            if ($part === '') {
                continue;
            }

            $normalised[] = match ($index) {
                0 => \strtolower($part),                                             // language
                default => match (\strlen($part)) {
                    4 => \ucfirst(\strtolower($part)),                                // script
                    2, 3 => \strtoupper($part),                                       // region / variant
                    default => $part,                                                 // pass-through — extension / private-use
                },
            };
        }

        return \implode('-', $normalised);
    }
}
