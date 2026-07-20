<?php

declare(strict_types=1);

namespace Academorix\FinanceDigitalPassesSdk\Enums;

/**
 * Wire-visible backed enum for `wallet-pass.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
enum WalletPassKind: string
{
    case MembershipCard = 'membership_card';
    case EventTicket = 'event_ticket';
    case DayPassCard = 'day_pass_card';
}
