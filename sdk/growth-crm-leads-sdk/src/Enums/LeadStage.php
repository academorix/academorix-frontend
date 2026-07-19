<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Enums;

/**
 * Wire-visible backed enum for `lead.stage`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
enum LeadStage: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case TrialScheduled = 'trial_scheduled';
    case TrialCompleted = 'trial_completed';
    case Won = 'won';
    case Lost = 'lost';
}
