<?php

declare(strict_types=1);

namespace Academorix\Branding\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Base theme applied under a branding profile.
 *
 * ## Cases
 *
 *  * {@see self::Light} — force the light theme regardless of OS.
 *  * {@see self::Dark}  — force the dark theme.
 *  * {@see self::Auto}  — follow the OS colour-scheme preference.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BrandingTheme: string
{
    use Enum;

    #[Label('Light')]
    #[Description('Force the light theme regardless of OS setting.')]
    case Light = 'light';

    #[Label('Dark')]
    #[Description('Force the dark theme regardless of OS setting.')]
    case Dark = 'dark';

    #[Label('Auto')]
    #[Description('Follow the OS colour-scheme preference (prefers-color-scheme).')]
    case Auto = 'auto';
}
