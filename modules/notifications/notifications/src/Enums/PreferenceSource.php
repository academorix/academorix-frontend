<?php

declare(strict_types=1);

namespace Academorix\Notifications\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Origin of a preference update.
 *
 * Recorded on `PreferenceUpdated` events so the audit trail
 * distinguishes user-initiated changes from unsubscribe-link
 * clicks and admin overrides — an important discrimination for
 * GDPR Art. 7 consent evidence.
 *
 * ## Cases
 *
 *  * {@see self::UserSettings}    — user changed via settings UI.
 *  * {@see self::UnsubscribeLink} — user clicked email footer link.
 *  * {@see self::AdminOverride}   — tenant admin toggled via admin UI.
 *  * {@see self::Cascade}         — cascade update on a related row.
 *  * {@see self::Seed}            — initial platform / tenant seed.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PreferenceSource: string
{
    use Enum;

    #[Label('User settings')]
    #[Description('User updated the preference from the settings surface.')]
    case UserSettings = 'user_settings';

    #[Label('Unsubscribe link')]
    #[Description('User clicked an unsubscribe link from a notification.')]
    case UnsubscribeLink = 'unsubscribe_link';

    #[Label('Admin override')]
    #[Description('Tenant admin overrode the preference from the admin surface.')]
    case AdminOverride = 'admin_override';

    #[Label('Cascade')]
    #[Description('Cascade update propagated from a related row.')]
    case Cascade = 'cascade';

    #[Label('Seed')]
    #[Description('Initial platform or tenant seed value.')]
    case Seed = 'seed';
}
