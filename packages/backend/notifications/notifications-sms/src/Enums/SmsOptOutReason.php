<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Why a {@see \Stackra\Notifications\Sms\Models\SmsOptOut} row exists.
 *
 * ## Cases
 *
 *  * {@see self::StopKeyword}   — user replied STOP-family keyword.
 *  * {@see self::Admin}         — tenant admin manually added.
 *  * {@see self::Dnc}           — do-not-call registry match.
 *  * {@see self::InvalidNumber} — carrier permanently unreachable.
 *  * {@see self::Complaint}     — spam complaint filed with the carrier.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SmsOptOutReason: string
{
    use Enum;

    /**
     * User replied with a STOP-family keyword. TCPA-protected — revoking
     * requires super_admin + explicit re-consent evidence.
     */
    #[Label('STOP Keyword')]
    #[Description('User replied STOP / UNSUBSCRIBE. TCPA-protected — revoking requires explicit re-consent.')]
    case StopKeyword = 'stop_keyword';

    #[Label('Admin')]
    #[Description('Tenant admin manually opted the number out.')]
    case Admin = 'admin';

    #[Label('DNC Registry')]
    #[Description('Number matched a do-not-call registry entry.')]
    case Dnc = 'dnc';

    #[Label('Invalid Number')]
    #[Description('Carrier reported the number is permanently undeliverable. 30d recheck window.')]
    case InvalidNumber = 'invalid_number';

    #[Label('Complaint')]
    #[Description('Carrier reported a spam complaint on the number.')]
    case Complaint = 'complaint';
}
