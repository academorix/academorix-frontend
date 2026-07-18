<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * The device platform the subscription targets.
 *
 * ## Cases
 *
 *  * {@see self::Ios}     — iOS / iPadOS / watchOS via APNs.
 *  * {@see self::Android} — Android via FCM.
 *  * {@see self::Web}     — Web Push via FCM or a browser vendor endpoint.
 *  * {@see self::Macos}   — macOS via APNs.
 *  * {@see self::Other}   — Fallback for exotic platforms.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PushPlatform: string
{
    use Enum;

    #[Label('iOS')]
    #[Description('Apple mobile device — iPhone, iPad, iPod, watchOS.')]
    case Ios = 'ios';

    #[Label('Android')]
    #[Description('Google Android device — phones, tablets, Wear OS.')]
    case Android = 'android';

    #[Label('Web')]
    #[Description('Web Push endpoint — browser-side FCM or vendor endpoint.')]
    case Web = 'web';

    #[Label('macOS')]
    #[Description('Apple desktop / laptop device — macOS.')]
    case Macos = 'macos';

    #[Label('Other')]
    #[Description('Platform not covered by the standard set.')]
    case Other = 'other';
}
