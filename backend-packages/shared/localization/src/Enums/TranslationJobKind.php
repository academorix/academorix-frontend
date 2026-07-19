<?php

declare(strict_types=1);

namespace Academorix\Localization\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * The shape of work a
 * {@see \Academorix\Localization\Models\TranslationJob} performs.
 *
 * ## Cases
 *
 *  * {@see self::Namespace} — translate every key under a namespace
 *    (e.g. `validation`, `users`) for one or more target locales.
 *  * {@see self::Backfill}  — fill missing translations for a
 *    tenant across every already-enabled locale.
 *  * {@see self::Content}   — translate a specific model's translatable
 *    properties (per-row `HasTranslations` bulk backfill).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TranslationJobKind: string
{
    use Enum;

    #[Label('Namespace bulk')]
    #[Description('Translate every key under a namespace for one or more target locales.')]
    case Namespace = 'namespace';

    #[Label('Backfill missing')]
    #[Description('Fill missing translations across every enabled locale for the tenant.')]
    case Backfill = 'backfill';

    #[Label('Content bulk')]
    #[Description('Translate a specific model\'s HasTranslations properties across every enabled locale.')]
    case Content = 'content';
}
