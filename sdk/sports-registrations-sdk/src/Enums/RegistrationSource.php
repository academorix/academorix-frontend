<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `registration.source`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum RegistrationSource: string
{
    case WebForm = 'web_form';
    case Referral = 'referral';
    case WalkIn = 'walk_in';
    case ColdOutreach = 'cold_outreach';
    case Imported = 'imported';
    case CrmLead = 'crm_lead';
}
