<?php

declare(strict_types=1);

namespace Academorix\Localization\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Text direction for a script — Left-to-Right or Right-to-Left.
 *
 * Read via the `PlatformLanguage.direction` accessor that chains
 * through `geography::Language.is_rtl` / `geography::Language.dir`.
 * Surfaced on `/auth/me` so the SPA can set `<html dir="rtl">` for
 * Arabic, Hebrew, Persian, Urdu.
 *
 * ## Cases
 *
 *  * {@see self::Ltr} — Latin, Cyrillic, Han, Devanagari, Hangul, ...
 *  * {@see self::Rtl} — Arabic, Hebrew, Persian, Urdu, ...
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TextDirection: string
{
    use Enum;

    /**
     * Left-to-right — the default direction for the vast majority of
     * scripts (Latin, Cyrillic, Han, Hiragana, ...).
     */
    #[Label('Left to right')]
    #[Description('Default direction. Scripts read left to right (Latin, Cyrillic, Han, Hangul, ...).')]
    case Ltr = 'ltr';

    /**
     * Right-to-left — Arabic, Hebrew, Persian, Urdu, and other
     * right-to-left scripts.
     */
    #[Label('Right to left')]
    #[Description('Right-to-left direction. Arabic, Hebrew, Persian, Urdu, ...')]
    case Rtl = 'rtl';
}
