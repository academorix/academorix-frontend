<?php

declare(strict_types=1);

namespace Stackra\Notifications\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Digest batching mode for a per-user preference.
 *
 * Applied per `(category, channel)` on `notification_preferences.digest_mode`.
 * `Immediate` (the default) fires the notification at dispatch time; the
 * other modes accumulate items and deliver a batch on the window boundary.
 *
 * ## Cases
 *
 *  * {@see self::Immediate} — dispatch on emit (default).
 *  * {@see self::Daily}     — batch until user's daily-digest boundary.
 *  * {@see self::Weekly}    — batch until user's weekly-digest boundary.
 *  * {@see self::Off}       — mute entirely (equivalent to `enabled = false`).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DigestMode: string
{
    use Enum;

    #[Label('Immediate')]
    #[Description('Dispatch each notification at emit time. No batching.')]
    case Immediate = 'immediate';

    #[Label('Daily')]
    #[Description('Batch and deliver once per day at the user\'s daily digest boundary.')]
    case Daily = 'daily';

    #[Label('Weekly')]
    #[Description('Batch and deliver once per week at the user\'s weekly digest boundary.')]
    case Weekly = 'weekly';

    #[Label('Off')]
    #[Description('Mute delivery on this channel for this category entirely.')]
    case Off = 'off';
}
