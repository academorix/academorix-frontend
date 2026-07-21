<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `registration-activity.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum RegistrationActivityKind: string
{
    case Call = 'call';
    case Email = 'email';
    case Sms = 'sms';
    case Note = 'note';
    case Visit = 'visit';
    case StageChange = 'stage_change';
    case TaskCreated = 'task_created';
    case TaskCompleted = 'task_completed';
    case OfferMade = 'offer_made';
    case OfferAccepted = 'offer_accepted';
    case OfferDeclined = 'offer_declined';
    case AutoReminder = 'auto_reminder';
}
